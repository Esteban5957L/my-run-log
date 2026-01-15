import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';

// Helper para obtener parámetros de forma segura
const getParam = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return undefined;
};

const sendMessageSchema = z.object({
  receiverId: z.string(),
  content: z.string().max(2000),
  activityId: z.string().optional(),
  attachmentUrl: z.string().url().optional(),
  attachmentType: z.enum(['image', 'file']).optional(),
  attachmentName: z.string().optional(),
});

const addReactionSchema = z.object({
  emoji: z.string().min(1).max(4),
});

// Obtener conversaciones
export async function getConversations(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Obtener usuarios con los que tengo conversaciones
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: req.user.userId },
          { receiverId: req.user.userId }
        ]
      },
      orderBy: { sentAt: 'desc' },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true, role: true }
        },
        receiver: {
          select: { id: true, name: true, avatar: true, role: true }
        }
      }
    });

    // Agrupar por conversación
    const conversationsMap = new Map<string, {
      user: { id: string; name: string; avatar: string | null; role: string };
      lastMessage: typeof messages[0];
      unreadCount: number;
    }>();

    for (const message of messages) {
      const otherUser = message.senderId === req.user.userId 
        ? message.receiver 
        : message.sender;
      
      if (!conversationsMap.has(otherUser.id)) {
        const unreadCount = await prisma.message.count({
          where: {
            senderId: otherUser.id,
            receiverId: req.user.userId,
            readAt: null,
          }
        });

        conversationsMap.set(otherUser.id, {
          user: otherUser,
          lastMessage: message,
          unreadCount,
        });
      }
    }

    const conversations = Array.from(conversationsMap.values())
      .sort((a, b) => b.lastMessage.sentAt.getTime() - a.lastMessage.sentAt.getTime())
      .map(conv => ({
        oderId: conv.user.id,
        odername: conv.user.name,
        oderAvatar: conv.user.avatar,
        lastMessage: {
          content: conv.lastMessage.content,
          sentAt: conv.lastMessage.sentAt,
          isFromMe: conv.lastMessage.senderId === req.user!.userId,
        },
        unreadCount: conv.unreadCount,
      }));

    res.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Error al obtener conversaciones' });
  }
}

// Obtener mensajes de una conversación
export async function getMessages(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = getParam(req.params.userId);
    if (!userId) {
      return res.status(400).json({ error: 'userId es requerido' });
    }
    const limit = getParam(req.query.limit) || '50';
    const before = getParam(req.query.before);

    // Verificar que puedo chatear con este usuario
    const otherUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!otherUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Solo puede chatear: coach con sus atletas, atleta con su coach
    let canChat = false;
    if (req.user.role === 'COACH') {
      canChat = otherUser.coachId === req.user.userId;
    } else {
      const currentUser = await prisma.user.findUnique({
        where: { id: req.user.userId }
      });
      canChat = currentUser?.coachId === userId;
    }

    if (!canChat) {
      return res.status(403).json({ error: 'No puedes chatear con este usuario' });
    }

    const where: any = {
      OR: [
        { senderId: req.user.userId, receiverId: userId },
        { senderId: userId, receiverId: req.user.userId }
      ]
    };

    if (before) {
      where.sentAt = { lt: new Date(before) };
    }

    const messages = await prisma.message.findMany({
      where,
      take: parseInt(limit),
      orderBy: { sentAt: 'desc' },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true }
        },
      }
    });

    // Cargar actividades si existen activityIds
    const messagesWithActivities = await Promise.all(
      messages.map(async (msg) => {
        if (msg.activityId) {
          try {
            const activity = await prisma.activity.findUnique({
              where: { id: msg.activityId },
              select: {
                id: true,
                name: true,
                activityType: true,
                date: true,
                distance: true,
                duration: true,
                avgPace: true,
              }
            });
            return { ...msg, activity };
          } catch {
            return { ...msg, activity: null };
          }
        }
        return { ...msg, activity: null };
      })
    );

    // Marcar como leídos los mensajes recibidos
    await prisma.message.updateMany({
      where: {
        senderId: userId,
        receiverId: req.user.userId,
        readAt: null,
      },
      data: { readAt: new Date() }
    });

    res.json({ messages: messagesWithActivities.reverse() });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Error al obtener mensajes' });
  }
}

// Enviar mensaje
export async function sendMessage(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const validation = sendMessageSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: validation.error.flatten().fieldErrors 
      });
    }

    const { receiverId, content, activityId, attachmentUrl, attachmentType, attachmentName } = validation.data;

    // Verificar que hay contenido o adjunto o actividad
    if (!content && !attachmentUrl && !activityId) {
      return res.status(400).json({ error: 'El mensaje debe tener contenido, adjunto o actividad' });
    }

    // Verificar que puedo chatear con este usuario
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId }
    });

    if (!receiver) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar permisos de chat
    let canChat = false;
    if (req.user.role === 'COACH') {
      canChat = receiver.coachId === req.user.userId;
    } else {
      const currentUser = await prisma.user.findUnique({
        where: { id: req.user.userId }
      });
      canChat = currentUser?.coachId === receiverId;
    }

    if (!canChat) {
      return res.status(403).json({ error: 'No puedes enviar mensajes a este usuario' });
    }

    const message = await prisma.message.create({
      data: {
        senderId: req.user.userId,
        receiverId,
        content: content || '',
        activityId,
        attachmentUrl,
        attachmentType,
        attachmentName,
      },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true }
        },
      }
    });

    // Cargar actividad si existe
    let activity = null;
    if (activityId) {
      try {
        activity = await prisma.activity.findUnique({
          where: { id: activityId },
          select: {
            id: true,
            name: true,
            activityType: true,
            date: true,
            distance: true,
            duration: true,
            avgPace: true,
          }
        });
      } catch {
        // Ignorar error si la actividad no existe
      }
    }

    res.status(201).json({ message: { ...message, activity } });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Error al enviar mensaje' });
  }
}

// Obtener conteo de mensajes no leídos
export async function getUnreadCount(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const count = await prisma.message.count({
      where: {
        receiverId: req.user.userId,
        readAt: null,
      }
    });

    res.json({ count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Error al obtener mensajes no leídos' });
  }
}

// Agregar reacción a un mensaje
export async function addReaction(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const messageId = getParam(req.params.messageId);
    if (!messageId) {
      return res.status(400).json({ error: 'messageId es requerido' });
    }

    const validation = addReactionSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Emoji inválido' });
    }

    const { emoji } = validation.data;

    // Obtener el mensaje
    const message = await prisma.message.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      return res.status(404).json({ error: 'Mensaje no encontrado' });
    }

    // Verificar que el usuario puede ver este mensaje
    if (message.senderId !== req.user.userId && message.receiverId !== req.user.userId) {
      return res.status(403).json({ error: 'No tienes acceso a este mensaje' });
    }

    // Obtener reacciones actuales
    let reactions: Array<{ userId: string; emoji: string }> = [];
    if (message.reactions) {
      try {
        reactions = message.reactions as Array<{ userId: string; emoji: string }>;
      } catch {
        reactions = [];
      }
    }

    // Verificar si ya reaccionó con el mismo emoji
    const existingIndex = reactions.findIndex(
      r => r.userId === req.user!.userId && r.emoji === emoji
    );

    if (existingIndex >= 0) {
      // Quitar la reacción (toggle)
      reactions.splice(existingIndex, 1);
    } else {
      // Quitar cualquier reacción anterior del mismo usuario
      reactions = reactions.filter(r => r.userId !== req.user!.userId);
      // Agregar la nueva reacción
      reactions.push({ userId: req.user.userId, emoji });
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: { reactions },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
      }
    });

    // Cargar actividad si existe
    let activity = null;
    if (updated.activityId) {
      try {
        activity = await prisma.activity.findUnique({
          where: { id: updated.activityId },
          select: {
            id: true,
            name: true,
            activityType: true,
            date: true,
            distance: true,
            duration: true,
            avgPace: true,
          }
        });
      } catch {
        // Ignorar error
      }
    }

    res.json({ message: { ...updated, activity } });
  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({ error: 'Error al agregar reacción' });
  }
}

// Marcar mensajes como leídos
export async function markAsRead(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const senderId = getParam(req.params.senderId);
    if (!senderId) {
      return res.status(400).json({ error: 'senderId es requerido' });
    }

    await prisma.message.updateMany({
      where: {
        senderId,
        receiverId: req.user.userId,
        readAt: null,
      },
      data: { readAt: new Date() }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Error al marcar como leído' });
  }
}

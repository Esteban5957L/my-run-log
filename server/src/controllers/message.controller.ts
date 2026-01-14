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
  content: z.string().min(1).max(2000),
  activityId: z.string().optional(),
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
        }
      }
    });

    // Marcar como leídos los mensajes recibidos
    await prisma.message.updateMany({
      where: {
        senderId: userId,
        receiverId: req.user.userId,
        readAt: null,
      },
      data: { readAt: new Date() }
    });

    res.json({ messages: messages.reverse() });
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

    const { receiverId, content, activityId } = validation.data;

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
        content,
        activityId,
      },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true }
        }
      }
    });

    res.status(201).json({ message });
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

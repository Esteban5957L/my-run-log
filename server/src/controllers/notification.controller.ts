import { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { NotificationType } from '@prisma/client';

// Helper para obtener parámetros de forma segura
const getParam = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return undefined;
};

// Obtener notificaciones del usuario
export async function getNotifications(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const limit = parseInt(getParam(req.query.limit) || '20');
    const offset = parseInt(getParam(req.query.offset) || '0');
    const unreadOnly = getParam(req.query.unreadOnly) === 'true';

    const where: any = { userId: req.user.userId };
    if (unreadOnly) {
      where.read = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: req.user.userId, read: false } }),
    ]);

    res.json({ notifications, total, unreadCount });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
}

// Obtener conteo de no leídas
export async function getUnreadCount(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const count = await prisma.notification.count({
      where: { userId: req.user.userId, read: false },
    });

    res.json({ count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Error al obtener conteo' });
  }
}

// Marcar notificación como leída
export async function markAsRead(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const notificationId = getParam(req.params.notificationId);
    if (!notificationId) {
      return res.status(400).json({ error: 'notificationId es requerido' });
    }

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== req.user.userId) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true, readAt: new Date() },
    });

    res.json({ notification: updated });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Error al marcar como leída' });
  }
}

// Marcar todas como leídas
export async function markAllAsRead(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    await prisma.notification.updateMany({
      where: { userId: req.user.userId, read: false },
      data: { read: true, readAt: new Date() },
    });

    res.json({ message: 'Todas las notificaciones marcadas como leídas' });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ error: 'Error al marcar todas como leídas' });
  }
}

// Eliminar notificación
export async function deleteNotification(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const notificationId = getParam(req.params.notificationId);
    if (!notificationId) {
      return res.status(400).json({ error: 'notificationId es requerido' });
    }

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== req.user.userId) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    res.json({ message: 'Notificación eliminada' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Error al eliminar notificación' });
  }
}

// ============================================
// FUNCIONES HELPER PARA CREAR NOTIFICACIONES
// ============================================

export async function createNotification(data: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  planId?: string;
  sessionId?: string;
  activityId?: string;
  fromUserId?: string;
}) {
  try {
    const notification = await prisma.notification.create({
      data,
    });
    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    return null;
  }
}

// Notificar al atleta que se le asignó un plan
export async function notifyPlanAssigned(athleteId: string, planId: string, planName: string, coachId: string) {
  const coach = await prisma.user.findUnique({ where: { id: coachId }, select: { name: true } });
  return createNotification({
    userId: athleteId,
    type: 'PLAN_ASSIGNED',
    title: '📋 Nuevo plan asignado',
    message: `${coach?.name || 'Tu entrenador'} te ha asignado el plan "${planName}"`,
    planId,
    fromUserId: coachId,
  });
}

// Notificar al coach que un atleta completó una sesión
export async function notifySessionCompleted(coachId: string, athleteId: string, sessionTitle: string, planId: string, sessionId: string) {
  const athlete = await prisma.user.findUnique({ where: { id: athleteId }, select: { name: true } });
  return createNotification({
    userId: coachId,
    type: 'SESSION_COMPLETED',
    title: '✅ Sesión completada',
    message: `${athlete?.name || 'Un atleta'} ha completado la sesión "${sessionTitle}"`,
    planId,
    sessionId,
    fromUserId: athleteId,
  });
}

// Notificar al coach que un atleta saltó una sesión
export async function notifySessionSkipped(coachId: string, athleteId: string, sessionTitle: string, planId: string, sessionId: string) {
  const athlete = await prisma.user.findUnique({ where: { id: athleteId }, select: { name: true } });
  return createNotification({
    userId: coachId,
    type: 'SESSION_SKIPPED',
    title: '⏭️ Sesión saltada',
    message: `${athlete?.name || 'Un atleta'} ha saltado la sesión "${sessionTitle}"`,
    planId,
    sessionId,
    fromUserId: athleteId,
  });
}

// Notificar al atleta que el coach dejó feedback
export async function notifyCoachFeedback(athleteId: string, coachId: string, sessionTitle: string, planId: string, sessionId: string) {
  const coach = await prisma.user.findUnique({ where: { id: coachId }, select: { name: true } });
  return createNotification({
    userId: athleteId,
    type: 'COACH_FEEDBACK',
    title: '💬 Nuevo feedback',
    message: `${coach?.name || 'Tu entrenador'} ha dejado un comentario en "${sessionTitle}"`,
    planId,
    sessionId,
    fromUserId: coachId,
  });
}

// Notificar nueva actividad sincronizada
export async function notifyActivitySynced(coachId: string, athleteId: string, activityName: string, activityId: string) {
  const athlete = await prisma.user.findUnique({ where: { id: athleteId }, select: { name: true } });
  return createNotification({
    userId: coachId,
    type: 'ACTIVITY_SYNCED',
    title: '🏃 Nueva actividad',
    message: `${athlete?.name || 'Un atleta'} ha registrado "${activityName}"`,
    activityId,
    fromUserId: athleteId,
  });
}

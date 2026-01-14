import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { ActivityType, TerrainType } from '@prisma/client';

const createActivitySchema = z.object({
  name: z.string().min(1),
  activityType: z.nativeEnum(ActivityType).default('RUNNING'),
  date: z.string().datetime(),
  distance: z.number().positive(),
  duration: z.number().positive(),
  elevationGain: z.number().default(0),
  elevationLoss: z.number().default(0),
  avgPace: z.number().optional(),
  avgHeartRate: z.number().optional(),
  maxHeartRate: z.number().optional(),
  calories: z.number().optional(),
  terrainType: z.nativeEnum(TerrainType).optional(),
  locationName: z.string().optional(),
  startLat: z.number().optional(),
  startLng: z.number().optional(),
  notes: z.string().optional(),
  perceivedEffort: z.number().min(1).max(10).optional(),
  planSessionId: z.string().optional(),
});

const updateActivitySchema = createActivitySchema.partial();

// Obtener actividades (propias o de un atleta si eres coach)
export async function getActivities(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { userId, from, to, type, limit = '50', offset = '0' } = req.query;
    
    let targetUserId = req.user.userId;

    // Si se especifica un userId, verificar permisos
    if (userId && typeof userId === 'string') {
      if (req.user.role === 'COACH') {
        const athlete = await prisma.user.findFirst({
          where: { id: userId, coachId: req.user.userId }
        });
        if (!athlete) {
          return res.status(403).json({ error: 'No tienes permisos para ver estas actividades' });
        }
        targetUserId = userId;
      } else if (userId !== req.user.userId) {
        return res.status(403).json({ error: 'No tienes permisos para ver estas actividades' });
      }
    }

    const where: any = { userId: targetUserId };

    if (from && typeof from === 'string') {
      where.date = { ...where.date, gte: new Date(from) };
    }
    if (to && typeof to === 'string') {
      where.date = { ...where.date, lte: new Date(to) };
    }
    if (type && typeof type === 'string') {
      where.activityType = type;
    }

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
        orderBy: { date: 'desc' },
        include: {
          planSession: {
            select: {
              id: true,
              title: true,
              targetDistance: true,
              targetDuration: true,
            }
          }
        }
      }),
      prisma.activity.count({ where })
    ]);

    res.json({ activities, total });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ error: 'Error al obtener actividades' });
  }
}

// Obtener una actividad por ID
export async function getActivity(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { activityId } = req.params;

    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      include: {
        user: {
          select: { id: true, name: true, avatar: true, coachId: true }
        },
        planSession: {
          include: {
            plan: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });

    if (!activity) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }

    // Verificar permisos
    const canView = 
      activity.userId === req.user.userId || 
      (req.user.role === 'COACH' && activity.user.coachId === req.user.userId);

    if (!canView) {
      return res.status(403).json({ error: 'No tienes permisos para ver esta actividad' });
    }

    res.json({ activity });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ error: 'Error al obtener actividad' });
  }
}

// Crear actividad manual
export async function createActivity(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const validation = createActivitySchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: validation.error.flatten().fieldErrors 
      });
    }

    const data = validation.data;

    // Calcular pace si no se proporciona
    if (!data.avgPace && data.distance > 0) {
      data.avgPace = data.duration / data.distance;
    }

    const activity = await prisma.activity.create({
      data: {
        ...data,
        userId: req.user.userId,
        date: new Date(data.date),
      }
    });

    // Si está vinculada a una sesión de plan, marcarla como completada
    if (data.planSessionId) {
      await prisma.planSession.update({
        where: { id: data.planSessionId },
        data: { completed: true }
      });
    }

    res.status(201).json({ activity });
  } catch (error) {
    console.error('Create activity error:', error);
    res.status(500).json({ error: 'Error al crear actividad' });
  }
}

// Actualizar actividad
export async function updateActivity(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { activityId } = req.params;

    const existing = await prisma.activity.findUnique({
      where: { id: activityId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }

    if (existing.userId !== req.user.userId) {
      return res.status(403).json({ error: 'No tienes permisos para editar esta actividad' });
    }

    const validation = updateActivitySchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: validation.error.flatten().fieldErrors 
      });
    }

    const activity = await prisma.activity.update({
      where: { id: activityId },
      data: {
        ...validation.data,
        date: validation.data.date ? new Date(validation.data.date) : undefined,
      }
    });

    res.json({ activity });
  } catch (error) {
    console.error('Update activity error:', error);
    res.status(500).json({ error: 'Error al actualizar actividad' });
  }
}

// Eliminar actividad
export async function deleteActivity(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { activityId } = req.params;

    const existing = await prisma.activity.findUnique({
      where: { id: activityId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }

    if (existing.userId !== req.user.userId) {
      return res.status(403).json({ error: 'No tienes permisos para eliminar esta actividad' });
    }

    await prisma.activity.delete({
      where: { id: activityId }
    });

    res.json({ message: 'Actividad eliminada' });
  } catch (error) {
    console.error('Delete activity error:', error);
    res.status(500).json({ error: 'Error al eliminar actividad' });
  }
}

// Agregar feedback del coach a una actividad
export async function addCoachFeedback(req: Request, res: Response) {
  try {
    if (!req.user || req.user.role !== 'COACH') {
      return res.status(403).json({ error: 'Solo los entrenadores pueden agregar feedback' });
    }

    const { activityId } = req.params;
    const { feedback } = req.body;

    if (!feedback || typeof feedback !== 'string') {
      return res.status(400).json({ error: 'El feedback es requerido' });
    }

    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      include: {
        user: { select: { coachId: true } }
      }
    });

    if (!activity) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }

    if (activity.user.coachId !== req.user.userId) {
      return res.status(403).json({ error: 'No eres el entrenador de este atleta' });
    }

    const updated = await prisma.activity.update({
      where: { id: activityId },
      data: { coachFeedback: feedback }
    });

    res.json({ activity: updated });
  } catch (error) {
    console.error('Add coach feedback error:', error);
    res.status(500).json({ error: 'Error al agregar feedback' });
  }
}

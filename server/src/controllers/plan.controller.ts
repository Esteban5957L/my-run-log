import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { SessionType, PlanStatus } from '@prisma/client';

// Helper para obtener parámetros de forma segura
const getParam = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return undefined;
};

const sessionSchema = z.object({
  date: z.string().datetime(),
  sessionType: z.nativeEnum(SessionType),
  title: z.string().min(1),
  description: z.string().optional(),
  targetDistance: z.number().positive().optional(),
  targetDuration: z.number().positive().optional(),
  targetPace: z.number().positive().optional(),
  warmup: z.string().optional(),
  mainWorkout: z.string().optional(),
  cooldown: z.string().optional(),
});

const createPlanSchema = z.object({
  athleteId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  sessions: z.array(sessionSchema).optional(),
});

const updatePlanSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.nativeEnum(PlanStatus).optional(),
});

// Obtener planes (como coach: todos mis planes, como atleta: mis planes asignados)
export async function getPlans(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const athleteId = getParam(req.query.athleteId);
    const status = getParam(req.query.status);

    let where: any = {};

    if (req.user.role === 'COACH') {
      where.coachId = req.user.userId;
      if (athleteId) {
        where.athleteId = athleteId;
      }
    } else {
      where.athleteId = req.user.userId;
    }

    if (status) {
      where.status = status;
    }

    const plans = await prisma.trainingPlan.findMany({
      where,
      include: {
        athlete: {
          select: { id: true, name: true, avatar: true }
        },
        coach: {
          select: { id: true, name: true }
        },
        _count: {
          select: { sessions: true }
        },
        sessions: {
          where: { completed: false },
          take: 3,
          orderBy: { date: 'asc' }
        }
      },
      orderBy: { startDate: 'desc' }
    });

    res.json({ plans });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ error: 'Error al obtener planes' });
  }
}

// Obtener un plan por ID
export async function getPlan(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const planId = getParam(req.params.planId);
    if (!planId) {
      return res.status(400).json({ error: 'planId es requerido' });
    }

    const plan = await prisma.trainingPlan.findUnique({
      where: { id: planId },
      include: {
        athlete: {
          select: { id: true, name: true, avatar: true, email: true }
        },
        coach: {
          select: { id: true, name: true }
        },
        sessions: {
          orderBy: { date: 'asc' },
          include: {
            activities: {
              select: {
                id: true,
                name: true,
                distance: true,
                duration: true,
                avgPace: true,
              }
            }
          }
        }
      }
    });

    if (!plan) {
      return res.status(404).json({ error: 'Plan no encontrado' });
    }

    // Verificar permisos
    const canView = 
      plan.coachId === req.user.userId || 
      plan.athleteId === req.user.userId;

    if (!canView) {
      return res.status(403).json({ error: 'No tienes permisos para ver este plan' });
    }

    // Calcular estadísticas del plan
    const completedSessions = plan.sessions.filter((s: { completed: boolean }) => s.completed).length;
    const totalSessions = plan.sessions.length;
    const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

    res.json({ 
      plan,
      stats: {
        completedSessions,
        totalSessions,
        completionRate: Math.round(completionRate),
      }
    });
  } catch (error) {
    console.error('Get plan error:', error);
    res.status(500).json({ error: 'Error al obtener plan' });
  }
}

// Crear plan (solo coaches)
export async function createPlan(req: Request, res: Response) {
  try {
    if (!req.user || req.user.role !== 'COACH') {
      return res.status(403).json({ error: 'Solo los entrenadores pueden crear planes' });
    }

    const validation = createPlanSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: validation.error.flatten().fieldErrors 
      });
    }

    const { athleteId, name, description, startDate, endDate, sessions } = validation.data;

    // Verificar que el atleta pertenece al coach
    const athlete = await prisma.user.findFirst({
      where: { id: athleteId, coachId: req.user.userId }
    });

    if (!athlete) {
      return res.status(404).json({ error: 'Atleta no encontrado o no te pertenece' });
    }

    const plan = await prisma.trainingPlan.create({
      data: {
        coachId: req.user.userId,
        athleteId,
        name,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        sessions: sessions ? {
          create: sessions.map(s => ({
            ...s,
            date: new Date(s.date),
          }))
        } : undefined,
      },
      include: {
        sessions: true,
        athlete: {
          select: { id: true, name: true }
        }
      }
    });

    res.status(201).json({ plan });
  } catch (error) {
    console.error('Create plan error:', error);
    res.status(500).json({ error: 'Error al crear plan' });
  }
}

// Actualizar plan
export async function updatePlan(req: Request, res: Response) {
  try {
    if (!req.user || req.user.role !== 'COACH') {
      return res.status(403).json({ error: 'Solo los entrenadores pueden actualizar planes' });
    }

    const planId = getParam(req.params.planId);
    if (!planId) {
      return res.status(400).json({ error: 'planId es requerido' });
    }

    const existing = await prisma.trainingPlan.findUnique({
      where: { id: planId }
    });

    if (!existing || existing.coachId !== req.user.userId) {
      return res.status(404).json({ error: 'Plan no encontrado' });
    }

    const validation = updatePlanSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: validation.error.flatten().fieldErrors 
      });
    }

    const plan = await prisma.trainingPlan.update({
      where: { id: planId },
      data: validation.data,
    });

    res.json({ plan });
  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({ error: 'Error al actualizar plan' });
  }
}

// Eliminar plan
export async function deletePlan(req: Request, res: Response) {
  try {
    if (!req.user || req.user.role !== 'COACH') {
      return res.status(403).json({ error: 'Solo los entrenadores pueden eliminar planes' });
    }

    const planId = getParam(req.params.planId);
    if (!planId) {
      return res.status(400).json({ error: 'planId es requerido' });
    }

    const existing = await prisma.trainingPlan.findUnique({
      where: { id: planId }
    });

    if (!existing || existing.coachId !== req.user.userId) {
      return res.status(404).json({ error: 'Plan no encontrado' });
    }

    await prisma.trainingPlan.delete({
      where: { id: planId }
    });

    res.json({ message: 'Plan eliminado' });
  } catch (error) {
    console.error('Delete plan error:', error);
    res.status(500).json({ error: 'Error al eliminar plan' });
  }
}

// Agregar sesión a un plan
export async function addSession(req: Request, res: Response) {
  try {
    if (!req.user || req.user.role !== 'COACH') {
      return res.status(403).json({ error: 'Solo los entrenadores pueden agregar sesiones' });
    }

    const planId = getParam(req.params.planId);
    if (!planId) {
      return res.status(400).json({ error: 'planId es requerido' });
    }

    const plan = await prisma.trainingPlan.findUnique({
      where: { id: planId }
    });

    if (!plan || plan.coachId !== req.user.userId) {
      return res.status(404).json({ error: 'Plan no encontrado' });
    }

    const validation = sessionSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: validation.error.flatten().fieldErrors 
      });
    }

    const session = await prisma.planSession.create({
      data: {
        ...validation.data,
        planId,
        date: new Date(validation.data.date),
      }
    });

    res.status(201).json({ session });
  } catch (error) {
    console.error('Add session error:', error);
    res.status(500).json({ error: 'Error al agregar sesión' });
  }
}

// Marcar sesión como completada/skipped
export async function updateSessionStatus(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const sessionId = getParam(req.params.sessionId);
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId es requerido' });
    }
    const { completed, skipped } = req.body;

    const session = await prisma.planSession.findUnique({
      where: { id: sessionId },
      include: {
        plan: true
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }

    // Solo el atleta o su coach pueden actualizar
    const canUpdate = 
      session.plan.athleteId === req.user.userId ||
      session.plan.coachId === req.user.userId;

    if (!canUpdate) {
      return res.status(403).json({ error: 'No tienes permisos para actualizar esta sesión' });
    }

    const updated = await prisma.planSession.update({
      where: { id: sessionId },
      data: { 
        completed: completed ?? session.completed,
        skipped: skipped ?? session.skipped,
      }
    });

    res.json({ session: updated });
  } catch (error) {
    console.error('Update session status error:', error);
    res.status(500).json({ error: 'Error al actualizar sesión' });
  }
}

import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { SessionType, PlanStatus } from '@prisma/client';
import { notifyPlanAssigned, notifySessionCompleted, notifySessionSkipped, notifyCoachFeedback } from './notification.controller.js';
import { io } from '../index.js';

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

    // Notificar al atleta que se le asignó un plan
    const notification = await notifyPlanAssigned(athleteId, plan.id, name, req.user.userId);
    if (notification) {
      // Emitir notificación en tiempo real via Socket.io
      io.to(`user:${athleteId}`).emit('notification', notification);
    }

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

    const wasCompleted = session.completed;
    const wasSkipped = session.skipped;

    const updated = await prisma.planSession.update({
      where: { id: sessionId },
      data: { 
        completed: completed ?? session.completed,
        skipped: skipped ?? session.skipped,
        completedAt: completed ? new Date() : null,
      }
    });

    // Notificar al coach si el atleta completó o saltó la sesión
    if (req.user.role === 'ATHLETE' && session.plan.coachId && session.plan.athleteId) {
      if (completed && !wasCompleted) {
        const notification = await notifySessionCompleted(
          session.plan.coachId, 
          session.plan.athleteId, 
          session.title, 
          session.plan.id, 
          sessionId
        );
        if (notification) {
          io.to(`user:${session.plan.coachId}`).emit('notification', notification);
        }
      } else if (skipped && !wasSkipped) {
        const notification = await notifySessionSkipped(
          session.plan.coachId, 
          session.plan.athleteId, 
          session.title, 
          session.plan.id, 
          sessionId
        );
        if (notification) {
          io.to(`user:${session.plan.coachId}`).emit('notification', notification);
        }
      }
    }

    res.json({ session: updated });
  } catch (error) {
    console.error('Update session status error:', error);
    res.status(500).json({ error: 'Error al actualizar sesión' });
  }
}

// Agregar comentario/feedback del coach a una sesión
export async function addSessionFeedback(req: Request, res: Response) {
  try {
    if (!req.user || req.user.role !== 'COACH') {
      return res.status(403).json({ error: 'Solo los entrenadores pueden agregar feedback' });
    }

    const sessionId = getParam(req.params.sessionId);
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId es requerido' });
    }

    const { coachNotes, coachFeedback } = req.body;

    const session = await prisma.planSession.findUnique({
      where: { id: sessionId },
      include: { plan: true }
    });

    if (!session || session.plan.coachId !== req.user.userId) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }

    const hadFeedback = !!session.coachFeedback;

    const updated = await prisma.planSession.update({
      where: { id: sessionId },
      data: { 
        coachNotes: coachNotes !== undefined ? coachNotes : session.coachNotes,
        coachFeedback: coachFeedback !== undefined ? coachFeedback : session.coachFeedback,
      }
    });

    // Notificar al atleta si se agregó feedback (no solo notas internas)
    if (coachFeedback && !hadFeedback && session.plan.athleteId) {
      const notification = await notifyCoachFeedback(
        session.plan.athleteId,
        req.user.userId,
        session.title,
        session.plan.id,
        sessionId
      );
      if (notification) {
        io.to(`user:${session.plan.athleteId}`).emit('notification', notification);
      }
    }

    res.json({ session: updated });
  } catch (error) {
    console.error('Add session feedback error:', error);
    res.status(500).json({ error: 'Error al agregar feedback' });
  }
}

// Duplicar plan a otro atleta
export async function duplicatePlan(req: Request, res: Response) {
  try {
    if (!req.user || req.user.role !== 'COACH') {
      return res.status(403).json({ error: 'Solo los entrenadores pueden duplicar planes' });
    }

    const planId = getParam(req.params.planId);
    if (!planId) {
      return res.status(400).json({ error: 'planId es requerido' });
    }

    const { targetAthleteId, newName, startDate } = req.body;

    if (!targetAthleteId || !startDate) {
      return res.status(400).json({ error: 'targetAthleteId y startDate son requeridos' });
    }

    // Obtener el plan original con sus sesiones
    const originalPlan = await prisma.trainingPlan.findUnique({
      where: { id: planId },
      include: { sessions: true }
    });

    if (!originalPlan || originalPlan.coachId !== req.user.userId) {
      return res.status(404).json({ error: 'Plan no encontrado' });
    }

    // Verificar que el atleta destino pertenece al coach
    const targetAthlete = await prisma.user.findFirst({
      where: { id: targetAthleteId, coachId: req.user.userId }
    });

    if (!targetAthlete) {
      return res.status(404).json({ error: 'Atleta destino no encontrado' });
    }

    // Calcular la diferencia de días entre el plan original y el nuevo
    const originalStartDate = new Date(originalPlan.startDate);
    const newStartDate = new Date(startDate);
    const daysDiff = Math.floor((newStartDate.getTime() - originalStartDate.getTime()) / (1000 * 60 * 60 * 24));

    // Calcular nueva fecha de fin
    const originalDuration = Math.floor((new Date(originalPlan.endDate).getTime() - originalStartDate.getTime()) / (1000 * 60 * 60 * 24));
    const newEndDate = new Date(newStartDate);
    newEndDate.setDate(newEndDate.getDate() + originalDuration);

    // Crear el nuevo plan
    const newPlan = await prisma.trainingPlan.create({
      data: {
        coachId: req.user.userId,
        athleteId: targetAthleteId,
        name: newName || `${originalPlan.name} (copia)`,
        description: originalPlan.description,
        startDate: newStartDate,
        endDate: newEndDate,
        status: 'DRAFT',
        isTemplate: false,
        sessions: {
          create: originalPlan.sessions.map(session => {
            const sessionDate = new Date(session.date);
            sessionDate.setDate(sessionDate.getDate() + daysDiff);
            return {
              date: sessionDate,
              sessionType: session.sessionType,
              title: session.title,
              description: session.description,
              targetDistance: session.targetDistance,
              targetDuration: session.targetDuration,
              targetPace: session.targetPace,
              warmup: session.warmup,
              mainWorkout: session.mainWorkout,
              cooldown: session.cooldown,
              dayOffset: session.dayOffset,
            };
          })
        }
      },
      include: {
        sessions: true,
        athlete: { select: { id: true, name: true } }
      }
    });

    res.status(201).json({ plan: newPlan });
  } catch (error) {
    console.error('Duplicate plan error:', error);
    res.status(500).json({ error: 'Error al duplicar plan' });
  }
}

// Crear plantilla desde un plan existente
export async function createTemplate(req: Request, res: Response) {
  try {
    if (!req.user || req.user.role !== 'COACH') {
      return res.status(403).json({ error: 'Solo los entrenadores pueden crear plantillas' });
    }

    const planId = getParam(req.params.planId);
    if (!planId) {
      return res.status(400).json({ error: 'planId es requerido' });
    }

    const { templateName } = req.body;

    // Obtener el plan original
    const originalPlan = await prisma.trainingPlan.findUnique({
      where: { id: planId },
      include: { sessions: true }
    });

    if (!originalPlan || originalPlan.coachId !== req.user.userId) {
      return res.status(404).json({ error: 'Plan no encontrado' });
    }

    const originalStartDate = new Date(originalPlan.startDate);

    // Crear la plantilla
    const template = await prisma.trainingPlan.create({
      data: {
        coachId: req.user.userId,
        athleteId: null, // Las plantillas no tienen atleta asignado
        name: templateName || `Plantilla: ${originalPlan.name}`,
        description: originalPlan.description,
        startDate: new Date(), // Fecha de referencia
        endDate: new Date(Date.now() + (new Date(originalPlan.endDate).getTime() - originalStartDate.getTime())),
        status: 'DRAFT',
        isTemplate: true,
        sessions: {
          create: originalPlan.sessions.map(session => {
            const sessionDate = new Date(session.date);
            const dayOffset = Math.floor((sessionDate.getTime() - originalStartDate.getTime()) / (1000 * 60 * 60 * 24));
            return {
              date: sessionDate,
              sessionType: session.sessionType,
              title: session.title,
              description: session.description,
              targetDistance: session.targetDistance,
              targetDuration: session.targetDuration,
              targetPace: session.targetPace,
              warmup: session.warmup,
              mainWorkout: session.mainWorkout,
              cooldown: session.cooldown,
              dayOffset: dayOffset,
            };
          })
        }
      },
      include: { sessions: true }
    });

    res.status(201).json({ template });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ error: 'Error al crear plantilla' });
  }
}

// Obtener plantillas del coach
export async function getTemplates(req: Request, res: Response) {
  try {
    if (!req.user || req.user.role !== 'COACH') {
      return res.status(403).json({ error: 'Solo los entrenadores pueden ver plantillas' });
    }

    const templates = await prisma.trainingPlan.findMany({
      where: {
        coachId: req.user.userId,
        isTemplate: true,
      },
      include: {
        _count: { select: { sessions: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ templates });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: 'Error al obtener plantillas' });
  }
}

// Crear plan desde plantilla
export async function createPlanFromTemplate(req: Request, res: Response) {
  try {
    if (!req.user || req.user.role !== 'COACH') {
      return res.status(403).json({ error: 'Solo los entrenadores pueden crear planes' });
    }

    const templateId = getParam(req.params.templateId);
    if (!templateId) {
      return res.status(400).json({ error: 'templateId es requerido' });
    }

    const { athleteId, planName, startDate } = req.body;

    if (!athleteId || !startDate) {
      return res.status(400).json({ error: 'athleteId y startDate son requeridos' });
    }

    // Obtener la plantilla
    const template = await prisma.trainingPlan.findUnique({
      where: { id: templateId },
      include: { sessions: true }
    });

    if (!template || template.coachId !== req.user.userId || !template.isTemplate) {
      return res.status(404).json({ error: 'Plantilla no encontrada' });
    }

    // Verificar que el atleta pertenece al coach
    const athlete = await prisma.user.findFirst({
      where: { id: athleteId, coachId: req.user.userId }
    });

    if (!athlete) {
      return res.status(404).json({ error: 'Atleta no encontrado' });
    }

    const newStartDate = new Date(startDate);
    
    // Calcular duración de la plantilla
    const templateDuration = Math.floor(
      (new Date(template.endDate).getTime() - new Date(template.startDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    const newEndDate = new Date(newStartDate);
    newEndDate.setDate(newEndDate.getDate() + templateDuration);

    // Crear el plan
    const plan = await prisma.trainingPlan.create({
      data: {
        coachId: req.user.userId,
        athleteId,
        name: planName || template.name.replace('Plantilla: ', ''),
        description: template.description,
        startDate: newStartDate,
        endDate: newEndDate,
        status: 'DRAFT',
        isTemplate: false,
        sessions: {
          create: template.sessions.map(session => {
            const sessionDate = new Date(newStartDate);
            sessionDate.setDate(sessionDate.getDate() + (session.dayOffset || 0));
            return {
              date: sessionDate,
              sessionType: session.sessionType,
              title: session.title,
              description: session.description,
              targetDistance: session.targetDistance,
              targetDuration: session.targetDuration,
              targetPace: session.targetPace,
              warmup: session.warmup,
              mainWorkout: session.mainWorkout,
              cooldown: session.cooldown,
              dayOffset: session.dayOffset,
            };
          })
        }
      },
      include: {
        sessions: true,
        athlete: { select: { id: true, name: true } }
      }
    });

    res.status(201).json({ plan });
  } catch (error) {
    console.error('Create plan from template error:', error);
    res.status(500).json({ error: 'Error al crear plan desde plantilla' });
  }
}

// Obtener una plantilla específica
export async function getTemplate(req: Request, res: Response) {
  try {
    if (!req.user || req.user.role !== 'COACH') {
      return res.status(403).json({ error: 'Solo los entrenadores pueden ver plantillas' });
    }

    const templateId = getParam(req.params.templateId);
    if (!templateId) {
      return res.status(400).json({ error: 'templateId es requerido' });
    }

    const template = await prisma.trainingPlan.findUnique({
      where: { id: templateId },
      include: {
        sessions: { orderBy: { dayOffset: 'asc' } }
      }
    });

    if (!template || template.coachId !== req.user.userId || !template.isTemplate) {
      return res.status(404).json({ error: 'Plantilla no encontrada' });
    }

    res.json({ template });
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ error: 'Error al obtener plantilla' });
  }
}

// Actualizar una plantilla
export async function updateTemplate(req: Request, res: Response) {
  try {
    if (!req.user || req.user.role !== 'COACH') {
      return res.status(403).json({ error: 'Solo los entrenadores pueden editar plantillas' });
    }

    const templateId = getParam(req.params.templateId);
    if (!templateId) {
      return res.status(400).json({ error: 'templateId es requerido' });
    }

    const { name, description } = req.body;

    const template = await prisma.trainingPlan.findUnique({
      where: { id: templateId }
    });

    if (!template || template.coachId !== req.user.userId || !template.isTemplate) {
      return res.status(404).json({ error: 'Plantilla no encontrada' });
    }

    const updated = await prisma.trainingPlan.update({
      where: { id: templateId },
      data: {
        name: name || template.name,
        description: description !== undefined ? description : template.description,
      },
      include: {
        sessions: { orderBy: { dayOffset: 'asc' } }
      }
    });

    res.json({ template: updated });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ error: 'Error al actualizar plantilla' });
  }
}

// Eliminar una plantilla
export async function deleteTemplate(req: Request, res: Response) {
  try {
    if (!req.user || req.user.role !== 'COACH') {
      return res.status(403).json({ error: 'Solo los entrenadores pueden eliminar plantillas' });
    }

    const templateId = getParam(req.params.templateId);
    if (!templateId) {
      return res.status(400).json({ error: 'templateId es requerido' });
    }

    const template = await prisma.trainingPlan.findUnique({
      where: { id: templateId }
    });

    if (!template || template.coachId !== req.user.userId || !template.isTemplate) {
      return res.status(404).json({ error: 'Plantilla no encontrada' });
    }

    await prisma.trainingPlan.delete({
      where: { id: templateId }
    });

    res.json({ message: 'Plantilla eliminada' });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ error: 'Error al eliminar plantilla' });
  }
}

// Obtener todas las sesiones para el calendario
export async function getCalendarSessions(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const startDateStr = getParam(req.query.startDate);
    const endDateStr = getParam(req.query.endDate);
    const athleteId = getParam(req.query.athleteId);

    const startDate = startDateStr ? new Date(startDateStr) : new Date(new Date().setDate(1)); // Primer día del mes
    const endDate = endDateStr ? new Date(endDateStr) : new Date(new Date().setMonth(new Date().getMonth() + 1, 0)); // Último día del mes

    let where: any = {
      date: {
        gte: startDate,
        lte: endDate,
      },
      plan: {
        isTemplate: false,
      }
    };

    if (req.user.role === 'COACH') {
      where.plan.coachId = req.user.userId;
      if (athleteId) {
        where.plan.athleteId = athleteId;
      }
    } else {
      where.plan.athleteId = req.user.userId;
    }

    const sessions = await prisma.planSession.findMany({
      where,
      include: {
        plan: {
          select: {
            id: true,
            name: true,
            status: true,
            athlete: { select: { id: true, name: true, avatar: true } }
          }
        },
        activities: {
          select: { id: true, name: true, distance: true, duration: true }
        }
      },
      orderBy: { date: 'asc' }
    });

    // Agrupar por fecha
    const sessionsByDate: Record<string, typeof sessions> = {};
    sessions.forEach(session => {
      const dateKey = session.date.toISOString().split('T')[0];
      if (!sessionsByDate[dateKey]) {
        sessionsByDate[dateKey] = [];
      }
      sessionsByDate[dateKey].push(session);
    });

    res.json({ sessions, sessionsByDate });
  } catch (error) {
    console.error('Get calendar sessions error:', error);
    res.status(500).json({ error: 'Error al obtener sesiones del calendario' });
  }
}

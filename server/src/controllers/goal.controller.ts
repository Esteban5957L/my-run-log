import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { GoalType, GoalPeriod, GoalStatus } from '@prisma/client';

// Helper para obtener parámetros de forma segura
const getParam = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return undefined;
};

const createGoalSchema = z.object({
  type: z.enum(['DISTANCE', 'DURATION', 'WORKOUTS', 'ELEVATION', 'STREAK']),
  period: z.enum(['WEEKLY', 'MONTHLY', 'YEARLY', 'CUSTOM']),
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  targetValue: z.number().positive(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  notifyAt50: z.boolean().optional(),
  notifyAt75: z.boolean().optional(),
  notifyAt100: z.boolean().optional(),
});

// Obtener metas del usuario
export async function getGoals(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const status = getParam(req.query.status);
    const includeCompleted = getParam(req.query.includeCompleted) === 'true';

    const where: any = { userId: req.user.userId };
    
    if (status) {
      where.status = status;
    } else if (!includeCompleted) {
      where.status = { in: ['ACTIVE'] };
    }

    const goals = await prisma.goal.findMany({
      where,
      orderBy: [
        { status: 'asc' },
        { endDate: 'asc' },
      ],
    });

    // Calcular progreso para cada meta activa
    const goalsWithProgress = goals.map(goal => ({
      ...goal,
      progressPercent: Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100)),
      daysRemaining: Math.max(0, Math.ceil((new Date(goal.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
    }));

    res.json({ goals: goalsWithProgress });
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({ error: 'Error al obtener metas' });
  }
}

// Crear nueva meta
export async function createGoal(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const validation = createGoalSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation error',
        details: validation.error.flatten().fieldErrors,
      });
    }

    const { type, period, title, description, targetValue, notifyAt50, notifyAt75, notifyAt100 } = validation.data;

    // Calcular fechas según el período
    let startDate = new Date();
    let endDate = new Date();

    switch (period) {
      case 'WEEKLY':
        // Inicio de la semana actual (lunes)
        const dayOfWeek = startDate.getDay();
        const diff = startDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        startDate = new Date(startDate.setDate(diff));
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'MONTHLY':
        startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'YEARLY':
        startDate = new Date(startDate.getFullYear(), 0, 1);
        endDate = new Date(startDate.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      case 'CUSTOM':
        if (validation.data.startDate) {
          startDate = new Date(validation.data.startDate);
        }
        if (validation.data.endDate) {
          endDate = new Date(validation.data.endDate);
        }
        break;
    }

    // Calcular progreso actual basado en actividades existentes
    let currentValue = 0;
    
    if (type !== 'STREAK') {
      const activities = await prisma.activity.findMany({
        where: {
          userId: req.user.userId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      switch (type) {
        case 'DISTANCE':
          currentValue = activities.reduce((sum, a) => sum + a.distance, 0);
          break;
        case 'DURATION':
          currentValue = activities.reduce((sum, a) => sum + a.duration, 0) / 3600; // Convertir a horas
          break;
        case 'WORKOUTS':
          currentValue = activities.length;
          break;
        case 'ELEVATION':
          currentValue = activities.reduce((sum, a) => sum + a.elevationGain, 0);
          break;
      }
    } else {
      // Para racha, calcular días consecutivos
      const activities = await prisma.activity.findMany({
        where: { userId: req.user.userId },
        orderBy: { date: 'desc' },
        select: { date: true },
      });

      if (activities.length > 0) {
        let streak = 0;
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        for (const activity of activities) {
          const activityDate = new Date(activity.date);
          activityDate.setHours(0, 0, 0, 0);

          const diffDays = Math.floor((currentDate.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24));

          if (diffDays === 0 || diffDays === 1) {
            streak++;
            currentDate = activityDate;
          } else {
            break;
          }
        }
        currentValue = streak;
      }
    }

    const goal = await prisma.goal.create({
      data: {
        userId: req.user.userId,
        type: type as GoalType,
        period: period as GoalPeriod,
        title,
        description,
        targetValue,
        currentValue,
        startDate,
        endDate,
        notifyAt50: notifyAt50 ?? true,
        notifyAt75: notifyAt75 ?? true,
        notifyAt100: notifyAt100 ?? true,
        status: currentValue >= targetValue ? 'COMPLETED' : 'ACTIVE',
        completedAt: currentValue >= targetValue ? new Date() : null,
      },
    });

    res.status(201).json({
      goal: {
        ...goal,
        progressPercent: Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100)),
        daysRemaining: Math.max(0, Math.ceil((new Date(goal.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
      },
    });
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({ error: 'Error al crear meta' });
  }
}

// Actualizar meta
export async function updateGoal(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const goalId = getParam(req.params.goalId);
    if (!goalId) {
      return res.status(400).json({ error: 'goalId es requerido' });
    }

    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
    });

    if (!goal || goal.userId !== req.user.userId) {
      return res.status(404).json({ error: 'Meta no encontrada' });
    }

    const { title, description, targetValue, status } = req.body;

    const updated = await prisma.goal.update({
      where: { id: goalId },
      data: {
        title: title || goal.title,
        description: description !== undefined ? description : goal.description,
        targetValue: targetValue || goal.targetValue,
        status: status || goal.status,
        completedAt: status === 'COMPLETED' ? new Date() : goal.completedAt,
      },
    });

    res.json({
      goal: {
        ...updated,
        progressPercent: Math.min(100, Math.round((updated.currentValue / updated.targetValue) * 100)),
        daysRemaining: Math.max(0, Math.ceil((new Date(updated.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
      },
    });
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({ error: 'Error al actualizar meta' });
  }
}

// Eliminar meta
export async function deleteGoal(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const goalId = getParam(req.params.goalId);
    if (!goalId) {
      return res.status(400).json({ error: 'goalId es requerido' });
    }

    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
    });

    if (!goal || goal.userId !== req.user.userId) {
      return res.status(404).json({ error: 'Meta no encontrada' });
    }

    await prisma.goal.delete({
      where: { id: goalId },
    });

    res.json({ message: 'Meta eliminada' });
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({ error: 'Error al eliminar meta' });
  }
}

// Obtener estadísticas históricas (para gráficos de evolución)
export async function getHistoricalStats(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const months = parseInt(getParam(req.query.months) || '6');
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Obtener todas las actividades del período
    const activities = await prisma.activity.findMany({
      where: {
        userId: req.user.userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
      select: {
        date: true,
        distance: true,
        duration: true,
        elevationGain: true,
        avgPace: true,
        avgHeartRate: true,
      },
    });

    // Agrupar por mes
    const monthlyStats: Record<string, {
      month: string;
      year: number;
      distance: number;
      duration: number;
      elevation: number;
      workouts: number;
      avgPace: number | null;
      avgHeartRate: number | null;
    }> = {};

    activities.forEach(activity => {
      const date = new Date(activity.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyStats[key]) {
        monthlyStats[key] = {
          month: date.toLocaleDateString('es-ES', { month: 'short' }),
          year: date.getFullYear(),
          distance: 0,
          duration: 0,
          elevation: 0,
          workouts: 0,
          avgPace: null,
          avgHeartRate: null,
        };
      }

      monthlyStats[key].distance += activity.distance;
      monthlyStats[key].duration += activity.duration;
      monthlyStats[key].elevation += activity.elevationGain;
      monthlyStats[key].workouts += 1;
    });

    // Calcular promedios
    Object.keys(monthlyStats).forEach(key => {
      const monthActivities = activities.filter(a => {
        const date = new Date(a.date);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` === key;
      });

      const paces = monthActivities.filter(a => a.avgPace).map(a => a.avgPace!);
      const heartRates = monthActivities.filter(a => a.avgHeartRate).map(a => a.avgHeartRate!);

      monthlyStats[key].avgPace = paces.length > 0 ? paces.reduce((a, b) => a + b, 0) / paces.length : null;
      monthlyStats[key].avgHeartRate = heartRates.length > 0 ? heartRates.reduce((a, b) => a + b, 0) / heartRates.length : null;
    });

    // Agrupar por semana para comparativas
    const weeklyStats: Record<string, {
      week: string;
      startDate: string;
      distance: number;
      duration: number;
      workouts: number;
    }> = {};

    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const recentActivities = activities.filter(a => new Date(a.date) >= fourWeeksAgo);

    recentActivities.forEach(activity => {
      const date = new Date(activity.date);
      const weekStart = new Date(date);
      const dayOfWeek = weekStart.getDay();
      const diff = weekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      weekStart.setDate(diff);
      weekStart.setHours(0, 0, 0, 0);

      const key = weekStart.toISOString().split('T')[0];

      if (!weeklyStats[key]) {
        weeklyStats[key] = {
          week: weekStart.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
          startDate: key,
          distance: 0,
          duration: 0,
          workouts: 0,
        };
      }

      weeklyStats[key].distance += activity.distance;
      weeklyStats[key].duration += activity.duration;
      weeklyStats[key].workouts += 1;
    });

    // Ordenar y convertir a arrays
    const monthlyArray = Object.entries(monthlyStats)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([_, stats]) => stats);

    const weeklyArray = Object.entries(weeklyStats)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([_, stats]) => stats);

    // Calcular comparativa con período anterior
    const currentMonth = new Date();
    const previousMonth = new Date();
    previousMonth.setMonth(previousMonth.getMonth() - 1);

    const currentMonthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
    const previousMonthKey = `${previousMonth.getFullYear()}-${String(previousMonth.getMonth() + 1).padStart(2, '0')}`;

    const currentMonthStats = monthlyStats[currentMonthKey] || { distance: 0, duration: 0, workouts: 0 };
    const previousMonthStats = monthlyStats[previousMonthKey] || { distance: 0, duration: 0, workouts: 0 };

    const comparison = {
      distance: previousMonthStats.distance > 0 
        ? Math.round(((currentMonthStats.distance - previousMonthStats.distance) / previousMonthStats.distance) * 100)
        : 0,
      duration: previousMonthStats.duration > 0
        ? Math.round(((currentMonthStats.duration - previousMonthStats.duration) / previousMonthStats.duration) * 100)
        : 0,
      workouts: previousMonthStats.workouts > 0
        ? Math.round(((currentMonthStats.workouts - previousMonthStats.workouts) / previousMonthStats.workouts) * 100)
        : 0,
    };

    res.json({
      monthly: monthlyArray,
      weekly: weeklyArray,
      comparison,
    });
  } catch (error) {
    console.error('Get historical stats error:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas históricas' });
  }
}

// Actualizar progreso de metas cuando se sincroniza una actividad
export async function updateGoalsProgress(userId: string, activity: { distance: number; duration: number; elevationGain: number; date: Date }) {
  try {
    const activeGoals = await prisma.goal.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        startDate: { lte: activity.date },
        endDate: { gte: activity.date },
      },
    });

    for (const goal of activeGoals) {
      let increment = 0;

      switch (goal.type) {
        case 'DISTANCE':
          increment = activity.distance;
          break;
        case 'DURATION':
          increment = activity.duration / 3600; // Convertir a horas
          break;
        case 'WORKOUTS':
          increment = 1;
          break;
        case 'ELEVATION':
          increment = activity.elevationGain;
          break;
      }

      const newValue = goal.currentValue + increment;
      const isCompleted = newValue >= goal.targetValue;

      await prisma.goal.update({
        where: { id: goal.id },
        data: {
          currentValue: newValue,
          status: isCompleted ? 'COMPLETED' : 'ACTIVE',
          completedAt: isCompleted ? new Date() : null,
        },
      });

      // TODO: Crear notificación si alcanzó 50%, 75% o 100%
    }
  } catch (error) {
    console.error('Update goals progress error:', error);
  }
}

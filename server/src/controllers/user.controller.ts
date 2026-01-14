import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';

// Helper para obtener parámetros de forma segura
const getParam = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return undefined;
};

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  avatar: z.string().url().optional().nullable(),
});

export async function updateProfile(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const validation = updateProfileSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: validation.error.flatten().fieldErrors 
      });
    }

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: validation.data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        updatedAt: true,
      }
    });

    res.json({ user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
}

export async function getProfile(req: Request, res: Response) {
  try {
    const userId = getParam(req.params.userId);
    if (!userId) {
      return res.status(400).json({ error: 'userId es requerido' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        role: true,
        avatar: true,
        createdAt: true,
        _count: {
          select: {
            activities: true,
            athletes: true,
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
}

// Dashboard del atleta
export async function getAthleteDashboard(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        coach: {
          select: { id: true, name: true, avatar: true }
        },
        stravaToken: {
          select: { stravaAthleteId: true }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Fechas para cálculos
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Actividades de la semana
    const weeklyActivities = await prisma.activity.findMany({
      where: {
        userId: req.user.userId,
        date: { gte: startOfWeek }
      },
      orderBy: { date: 'asc' }
    });

    // Actividades del mes
    const monthlyActivities = await prisma.activity.findMany({
      where: {
        userId: req.user.userId,
        date: { gte: startOfMonth }
      }
    });

    // Calcular estadísticas semanales
    const weeklyStats = weeklyActivities.reduce((acc, act) => ({
      distance: acc.distance + act.distance,
      duration: acc.duration + act.duration,
      elevation: acc.elevation + act.elevationGain,
      workouts: acc.workouts + 1,
      totalPace: acc.totalPace + (act.avgPace || 0),
      paceCount: acc.paceCount + (act.avgPace ? 1 : 0),
    }), { distance: 0, duration: 0, elevation: 0, workouts: 0, totalPace: 0, paceCount: 0 });

    // Calcular estadísticas mensuales
    const monthlyStats = monthlyActivities.reduce((acc, act) => ({
      distance: acc.distance + act.distance,
      duration: acc.duration + act.duration,
      elevation: acc.elevation + act.elevationGain,
      workouts: acc.workouts + 1,
      totalPace: acc.totalPace + (act.avgPace || 0),
      paceCount: acc.paceCount + (act.avgPace ? 1 : 0),
      totalHr: acc.totalHr + (act.avgHeartRate || 0),
      hrCount: acc.hrCount + (act.avgHeartRate ? 1 : 0),
    }), { distance: 0, duration: 0, elevation: 0, workouts: 0, totalPace: 0, paceCount: 0, totalHr: 0, hrCount: 0 });

    // Progreso semanal por día
    const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const weeklyProgress = daysOfWeek.map((day, index) => {
      const dayActivities = weeklyActivities.filter(act => {
        const actDate = new Date(act.date);
        return actDate.getDay() === index;
      });
      return {
        day,
        distance: dayActivities.reduce((sum, act) => sum + act.distance, 0),
        duration: dayActivities.reduce((sum, act) => sum + act.duration, 0),
      };
    });

    // Calcular racha de días
    let streakDays = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const hasActivity = await prisma.activity.findFirst({
        where: {
          userId: req.user.userId,
          date: {
            gte: checkDate,
            lt: new Date(checkDate.getTime() + 24 * 60 * 60 * 1000)
          }
        }
      });
      if (hasActivity) {
        streakDays++;
      } else if (i > 0) {
        break;
      }
    }

    // Totales históricos
    const totals = await prisma.activity.aggregate({
      where: { userId: req.user.userId },
      _sum: { distance: true },
      _count: true
    });

    // Actividades recientes
    const recentActivities = await prisma.activity.findMany({
      where: { userId: req.user.userId },
      orderBy: { date: 'desc' },
      take: 5
    });

    // Plan activo
    const activePlan = await prisma.trainingPlan.findFirst({
      where: {
        athleteId: req.user.userId,
        status: 'ACTIVE',
      },
      include: {
        coach: {
          select: { id: true, name: true, avatar: true }
        },
        sessions: {
          orderBy: { date: 'asc' }
        }
      }
    });

    let planData = null;
    if (activePlan) {
      const completedSessions = activePlan.sessions.filter(s => s.completed).length;
      planData = {
        ...activePlan,
        completedSessions,
        totalSessions: activePlan.sessions.length,
        progressPercent: activePlan.sessions.length > 0 
          ? Math.round((completedSessions / activePlan.sessions.length) * 100)
          : 0
      };
    }

    // Mensajes no leídos
    const unreadMessages = await prisma.message.count({
      where: {
        receiverId: req.user.userId,
        readAt: null
      }
    });

    res.json({
      stats: {
        weekly: {
          distance: weeklyStats.distance,
          duration: weeklyStats.duration,
          elevation: weeklyStats.elevation,
          workouts: weeklyStats.workouts,
          avgPace: weeklyStats.paceCount > 0 ? weeklyStats.totalPace / weeklyStats.paceCount : null,
        },
        monthly: {
          distance: monthlyStats.distance,
          duration: monthlyStats.duration,
          elevation: monthlyStats.elevation,
          workouts: monthlyStats.workouts,
          avgPace: monthlyStats.paceCount > 0 ? monthlyStats.totalPace / monthlyStats.paceCount : null,
          avgHeartRate: monthlyStats.hrCount > 0 ? monthlyStats.totalHr / monthlyStats.hrCount : null,
        },
        weeklyProgress,
        streakDays,
        totalDistance: totals._sum.distance || 0,
        totalWorkouts: totals._count || 0,
      },
      recentActivities,
      activePlan: planData,
      coach: user.coach,
      stravaConnected: !!user.stravaToken,
      unreadMessages,
    });
  } catch (error) {
    console.error('Get athlete dashboard error:', error);
    res.status(500).json({ error: 'Error al obtener dashboard' });
  }
}

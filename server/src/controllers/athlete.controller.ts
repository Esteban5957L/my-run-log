import { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { subDays } from 'date-fns';

// Helper para obtener parámetros de forma segura
const getParam = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return undefined;
};

// Obtener todos los atletas de un entrenador
export async function getMyAthletes(req: Request, res: Response) {
  try {
    if (!req.user || req.user.role !== 'COACH') {
      return res.status(403).json({ error: 'Solo los entrenadores pueden ver atletas' });
    }

    const athletes = await prisma.user.findMany({
      where: { coachId: req.user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        createdAt: true,
        stravaToken: {
          select: { stravaAthleteId: true }
        },
        _count: {
          select: { activities: true }
        },
        activities: {
          take: 1,
          orderBy: { date: 'desc' },
          select: {
            id: true,
            date: true,
            name: true,
            distance: true,
            duration: true,
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Calcular estadísticas para cada atleta
    const athletesWithStats = await Promise.all(
      athletes.map(async (athlete) => {
        const weekAgo = subDays(new Date(), 7);
        
        const weeklyStats = await prisma.activity.aggregate({
          where: {
            userId: athlete.id,
            date: { gte: weekAgo }
          },
          _sum: {
            distance: true,
            duration: true,
            elevationGain: true,
          },
          _count: true,
        });

        const lastActivity = athlete.activities[0];
        const daysSinceLastActivity = lastActivity 
          ? Math.floor((Date.now() - new Date(lastActivity.date).getTime()) / (1000 * 60 * 60 * 24))
          : null;

        return {
          ...athlete,
          stravaConnected: !!athlete.stravaToken,
          lastActivity,
          daysSinceLastActivity,
          weeklyStats: {
            distance: weeklyStats._sum.distance || 0,
            duration: weeklyStats._sum.duration || 0,
            elevation: weeklyStats._sum.elevationGain || 0,
            workouts: weeklyStats._count,
          }
        };
      })
    );

    res.json({ athletes: athletesWithStats });
  } catch (error) {
    console.error('Get athletes error:', error);
    res.status(500).json({ error: 'Error al obtener atletas' });
  }
}

// Obtener detalle de un atleta
export async function getAthleteDetail(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const athleteId = getParam(req.params.athleteId);
    if (!athleteId) {
      return res.status(400).json({ error: 'athleteId es requerido' });
    }

    // Verificar permisos
    const athlete = await prisma.user.findUnique({
      where: { id: athleteId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        coachId: true,
        createdAt: true,
        stravaToken: {
          select: { stravaAthleteId: true }
        }
      }
    });

    if (!athlete) {
      return res.status(404).json({ error: 'Atleta no encontrado' });
    }

    // Solo el coach del atleta o el mismo atleta pueden ver el detalle
    if (req.user.role === 'COACH' && athlete.coachId !== req.user.userId) {
      return res.status(403).json({ error: 'No tienes permisos para ver este atleta' });
    }

    if (req.user.role === 'ATHLETE' && athlete.id !== req.user.userId) {
      return res.status(403).json({ error: 'No tienes permisos para ver este atleta' });
    }

    // Obtener estadísticas
    const thirtyDaysAgo = subDays(new Date(), 30);
    const sevenDaysAgo = subDays(new Date(), 7);

    const [monthlyStats, weeklyStats, recentActivities, activePlans] = await Promise.all([
      prisma.activity.aggregate({
        where: {
          userId: athleteId,
          date: { gte: thirtyDaysAgo }
        },
        _sum: {
          distance: true,
          duration: true,
          elevationGain: true,
        },
        _count: true,
        _avg: {
          avgPace: true,
          avgHeartRate: true,
        }
      }),
      prisma.activity.aggregate({
        where: {
          userId: athleteId,
          date: { gte: sevenDaysAgo }
        },
        _sum: {
          distance: true,
          duration: true,
          elevationGain: true,
        },
        _count: true,
      }),
      prisma.activity.findMany({
        where: { userId: athleteId },
        take: 10,
        orderBy: { date: 'desc' },
        select: {
          id: true,
          name: true,
          activityType: true,
          date: true,
          distance: true,
          duration: true,
          elevationGain: true,
          avgPace: true,
          avgHeartRate: true,
          coachFeedback: true,
        }
      }),
      prisma.trainingPlan.findMany({
        where: {
          athleteId,
          status: 'ACTIVE'
        },
        include: {
          _count: {
            select: { sessions: true }
          },
          sessions: {
            where: {
              date: { gte: new Date() }
            },
            take: 5,
            orderBy: { date: 'asc' }
          }
        }
      })
    ]);

    res.json({
      athlete: {
        ...athlete,
        stravaConnected: !!athlete.stravaToken,
      },
      stats: {
        monthly: {
          distance: monthlyStats._sum.distance || 0,
          duration: monthlyStats._sum.duration || 0,
          elevation: monthlyStats._sum.elevationGain || 0,
          workouts: monthlyStats._count,
          avgPace: monthlyStats._avg.avgPace,
          avgHeartRate: monthlyStats._avg.avgHeartRate,
        },
        weekly: {
          distance: weeklyStats._sum.distance || 0,
          duration: weeklyStats._sum.duration || 0,
          elevation: weeklyStats._sum.elevationGain || 0,
          workouts: weeklyStats._count,
        }
      },
      recentActivities,
      activePlans,
    });
  } catch (error) {
    console.error('Get athlete detail error:', error);
    res.status(500).json({ error: 'Error al obtener detalle del atleta' });
  }
}

// Desvincular atleta (como coach)
export async function removeAthlete(req: Request, res: Response) {
  try {
    if (!req.user || req.user.role !== 'COACH') {
      return res.status(403).json({ error: 'Solo los entrenadores pueden desvincular atletas' });
    }

    const athleteId = getParam(req.params.athleteId);
    if (!athleteId) {
      return res.status(400).json({ error: 'athleteId es requerido' });
    }

    const athlete = await prisma.user.findUnique({
      where: { id: athleteId }
    });

    if (!athlete || athlete.coachId !== req.user.userId) {
      return res.status(404).json({ error: 'Atleta no encontrado' });
    }

    await prisma.user.update({
      where: { id: athleteId },
      data: { coachId: null }
    });

    res.json({ message: 'Atleta desvinculado exitosamente' });
  } catch (error) {
    console.error('Remove athlete error:', error);
    res.status(500).json({ error: 'Error al desvincular atleta' });
  }
}

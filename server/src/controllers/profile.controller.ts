import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  avatar: z.string().url().optional().nullable(),
  birthDate: z.string().optional().nullable(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional().nullable(),
  weight: z.number().positive().max(500).optional().nullable(),
  height: z.number().positive().max(300).optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  hrZone1: z.number().int().positive().max(250).optional().nullable(),
  hrZone2: z.number().int().positive().max(250).optional().nullable(),
  hrZone3: z.number().int().positive().max(250).optional().nullable(),
  hrZone4: z.number().int().positive().max(250).optional().nullable(),
  hrZone5: z.number().int().positive().max(250).optional().nullable(),
  hrMax: z.number().int().positive().max(250).optional().nullable(),
  hrRest: z.number().int().positive().max(150).optional().nullable(),
});

// Obtener perfil completo
export async function getProfile(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        birthDate: true,
        gender: true,
        weight: true,
        height: true,
        bio: true,
        location: true,
        hrZone1: true,
        hrZone2: true,
        hrZone3: true,
        hrZone4: true,
        hrZone5: true,
        hrMax: true,
        hrRest: true,
        createdAt: true,
        coach: {
          select: { id: true, name: true, avatar: true },
        },
        stravaToken: {
          select: { stravaAthleteId: true },
        },
        _count: {
          select: {
            activities: true,
            goals: true,
            gear: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Calcular estadísticas totales
    const stats = await prisma.activity.aggregate({
      where: { userId: req.user.userId },
      _sum: {
        distance: true,
        duration: true,
        elevationGain: true,
      },
    });

    res.json({
      profile: {
        ...user,
        stravaConnected: !!user.stravaToken,
        totalStats: {
          distance: stats._sum.distance || 0,
          duration: stats._sum.duration || 0,
          elevation: stats._sum.elevationGain || 0,
          activities: user._count.activities,
        },
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
}

// Actualizar perfil
export async function updateProfile(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const validation = updateProfileSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation error',
        details: validation.error.flatten().fieldErrors,
      });
    }

    const data: any = { ...validation.data };

    // Convertir birthDate a Date si está presente
    if (data.birthDate) {
      data.birthDate = new Date(data.birthDate);
    }

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        birthDate: true,
        gender: true,
        weight: true,
        height: true,
        bio: true,
        location: true,
        hrZone1: true,
        hrZone2: true,
        hrZone3: true,
        hrZone4: true,
        hrZone5: true,
        hrMax: true,
        hrRest: true,
      },
    });

    res.json({ profile: user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
}

// Calcular zonas de FC automáticamente basado en FC máxima
export async function calculateHRZones(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { hrMax, hrRest } = req.body;

    if (!hrMax || hrMax < 100 || hrMax > 250) {
      return res.status(400).json({ error: 'FC máxima inválida (100-250)' });
    }

    // Fórmula de Karvonen para zonas de FC
    const reserve = hrMax - (hrRest || 60);
    const zones = {
      hrMax,
      hrRest: hrRest || 60,
      hrZone1: Math.round((hrRest || 60) + reserve * 0.5),  // 50% - Recuperación
      hrZone2: Math.round((hrRest || 60) + reserve * 0.6),  // 60% - Aeróbico fácil
      hrZone3: Math.round((hrRest || 60) + reserve * 0.7),  // 70% - Aeróbico moderado
      hrZone4: Math.round((hrRest || 60) + reserve * 0.8),  // 80% - Umbral
      hrZone5: Math.round((hrRest || 60) + reserve * 0.9),  // 90% - VO2max
    };

    // Guardar en la BD
    await prisma.user.update({
      where: { id: req.user.userId },
      data: zones,
    });

    res.json({ zones });
  } catch (error) {
    console.error('Calculate HR zones error:', error);
    res.status(500).json({ error: 'Error al calcular zonas de FC' });
  }
}

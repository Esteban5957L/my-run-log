import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { GearType, GearStatus } from '@prisma/client';

// Helper para obtener parámetros de forma segura
const getParam = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return undefined;
};

const createGearSchema = z.object({
  type: z.enum(['SHOES', 'WATCH', 'HEART_RATE', 'CLOTHING', 'OTHER']),
  brand: z.string().min(1).max(50),
  model: z.string().min(1).max(100),
  name: z.string().max(100).optional(),
  maxDistance: z.number().positive().optional(), // en km, se convertirá a metros
  purchaseDate: z.string().optional(),
  notes: z.string().max(500).optional(),
  imageUrl: z.string().url().optional(),
});

const updateGearSchema = z.object({
  brand: z.string().min(1).max(50).optional(),
  model: z.string().min(1).max(100).optional(),
  name: z.string().max(100).optional().nullable(),
  maxDistance: z.number().positive().optional().nullable(),
  purchaseDate: z.string().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  status: z.enum(['ACTIVE', 'RETIRED']).optional(),
});

// Obtener todo el equipamiento del usuario
export async function getGear(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const status = getParam(req.query.status);
    const type = getParam(req.query.type);

    const where: any = { userId: req.user.userId };
    if (status) where.status = status;
    if (type) where.type = type;

    const gear = await prisma.gear.findMany({
      where,
      orderBy: [
        { status: 'asc' },
        { totalDistance: 'desc' },
      ],
      include: {
        _count: {
          select: { activities: true },
        },
      },
    });

    // Agregar información de alerta
    const gearWithAlerts = gear.map(g => ({
      ...g,
      totalDistanceKm: g.totalDistance / 1000,
      maxDistanceKm: g.maxDistance ? g.maxDistance / 1000 : null,
      needsReplacement: g.maxDistance ? g.totalDistance >= g.maxDistance : false,
      usagePercent: g.maxDistance ? Math.min(100, Math.round((g.totalDistance / g.maxDistance) * 100)) : null,
    }));

    res.json({ gear: gearWithAlerts });
  } catch (error) {
    console.error('Get gear error:', error);
    res.status(500).json({ error: 'Error al obtener equipamiento' });
  }
}

// Obtener un equipo específico
export async function getGearById(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const gearId = getParam(req.params.gearId);
    if (!gearId) {
      return res.status(400).json({ error: 'gearId es requerido' });
    }

    const gear = await prisma.gear.findUnique({
      where: { id: gearId },
      include: {
        activities: {
          include: {
            activity: {
              select: {
                id: true,
                name: true,
                date: true,
                distance: true,
                duration: true,
                activityType: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!gear || gear.userId !== req.user.userId) {
      return res.status(404).json({ error: 'Equipamiento no encontrado' });
    }

    res.json({
      gear: {
        ...gear,
        totalDistanceKm: gear.totalDistance / 1000,
        maxDistanceKm: gear.maxDistance ? gear.maxDistance / 1000 : null,
        needsReplacement: gear.maxDistance ? gear.totalDistance >= gear.maxDistance : false,
        usagePercent: gear.maxDistance ? Math.min(100, Math.round((gear.totalDistance / gear.maxDistance) * 100)) : null,
        recentActivities: gear.activities.map(ag => ag.activity),
      },
    });
  } catch (error) {
    console.error('Get gear by id error:', error);
    res.status(500).json({ error: 'Error al obtener equipamiento' });
  }
}

// Crear nuevo equipamiento
export async function createGear(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const validation = createGearSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation error',
        details: validation.error.flatten().fieldErrors,
      });
    }

    const { type, brand, model, name, maxDistance, purchaseDate, notes, imageUrl } = validation.data;

    const gear = await prisma.gear.create({
      data: {
        userId: req.user.userId,
        type: type as GearType,
        brand,
        model,
        name,
        maxDistance: maxDistance ? maxDistance * 1000 : null, // Convertir km a metros
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        notes,
        imageUrl,
      },
    });

    res.status(201).json({
      gear: {
        ...gear,
        totalDistanceKm: 0,
        maxDistanceKm: maxDistance || null,
        needsReplacement: false,
        usagePercent: 0,
      },
    });
  } catch (error) {
    console.error('Create gear error:', error);
    res.status(500).json({ error: 'Error al crear equipamiento' });
  }
}

// Actualizar equipamiento
export async function updateGear(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const gearId = getParam(req.params.gearId);
    if (!gearId) {
      return res.status(400).json({ error: 'gearId es requerido' });
    }

    const existingGear = await prisma.gear.findUnique({
      where: { id: gearId },
    });

    if (!existingGear || existingGear.userId !== req.user.userId) {
      return res.status(404).json({ error: 'Equipamiento no encontrado' });
    }

    const validation = updateGearSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation error',
        details: validation.error.flatten().fieldErrors,
      });
    }

    const data: any = { ...validation.data };

    // Convertir km a metros si se proporciona maxDistance
    if (data.maxDistance !== undefined) {
      data.maxDistance = data.maxDistance ? data.maxDistance * 1000 : null;
    }

    // Convertir fecha si se proporciona
    if (data.purchaseDate !== undefined) {
      data.purchaseDate = data.purchaseDate ? new Date(data.purchaseDate) : null;
    }

    // Si se retira, guardar la fecha
    if (data.status === 'RETIRED' && existingGear.status !== 'RETIRED') {
      data.retiredDate = new Date();
    }

    const gear = await prisma.gear.update({
      where: { id: gearId },
      data,
    });

    res.json({
      gear: {
        ...gear,
        totalDistanceKm: gear.totalDistance / 1000,
        maxDistanceKm: gear.maxDistance ? gear.maxDistance / 1000 : null,
        needsReplacement: gear.maxDistance ? gear.totalDistance >= gear.maxDistance : false,
        usagePercent: gear.maxDistance ? Math.min(100, Math.round((gear.totalDistance / gear.maxDistance) * 100)) : null,
      },
    });
  } catch (error) {
    console.error('Update gear error:', error);
    res.status(500).json({ error: 'Error al actualizar equipamiento' });
  }
}

// Eliminar equipamiento
export async function deleteGear(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const gearId = getParam(req.params.gearId);
    if (!gearId) {
      return res.status(400).json({ error: 'gearId es requerido' });
    }

    const gear = await prisma.gear.findUnique({
      where: { id: gearId },
    });

    if (!gear || gear.userId !== req.user.userId) {
      return res.status(404).json({ error: 'Equipamiento no encontrado' });
    }

    await prisma.gear.delete({
      where: { id: gearId },
    });

    res.json({ message: 'Equipamiento eliminado' });
  } catch (error) {
    console.error('Delete gear error:', error);
    res.status(500).json({ error: 'Error al eliminar equipamiento' });
  }
}

// Asignar equipamiento a una actividad
export async function assignGearToActivity(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const activityId = getParam(req.params.activityId);
    const { gearId } = req.body;

    if (!activityId || !gearId) {
      return res.status(400).json({ error: 'activityId y gearId son requeridos' });
    }

    // Verificar que la actividad pertenece al usuario
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
    });

    if (!activity || activity.userId !== req.user.userId) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }

    // Verificar que el gear pertenece al usuario
    const gear = await prisma.gear.findUnique({
      where: { id: gearId },
    });

    if (!gear || gear.userId !== req.user.userId) {
      return res.status(404).json({ error: 'Equipamiento no encontrado' });
    }

    // Crear la relación
    await prisma.activityGear.create({
      data: {
        activityId,
        gearId,
      },
    });

    // Actualizar estadísticas del gear
    await prisma.gear.update({
      where: { id: gearId },
      data: {
        totalDistance: { increment: activity.distance * 1000 }, // Convertir km a metros
        totalDuration: { increment: activity.duration },
        totalActivities: { increment: 1 },
      },
    });

    res.json({ message: 'Equipamiento asignado a la actividad' });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Este equipamiento ya está asignado a esta actividad' });
    }
    console.error('Assign gear error:', error);
    res.status(500).json({ error: 'Error al asignar equipamiento' });
  }
}

// Remover equipamiento de una actividad
export async function removeGearFromActivity(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const activityId = getParam(req.params.activityId);
    const gearId = getParam(req.params.gearId);

    if (!activityId || !gearId) {
      return res.status(400).json({ error: 'activityId y gearId son requeridos' });
    }

    // Verificar que la actividad pertenece al usuario
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
    });

    if (!activity || activity.userId !== req.user.userId) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }

    // Eliminar la relación
    const deleted = await prisma.activityGear.deleteMany({
      where: {
        activityId,
        gearId,
      },
    });

    if (deleted.count === 0) {
      return res.status(404).json({ error: 'Relación no encontrada' });
    }

    // Actualizar estadísticas del gear (restar)
    await prisma.gear.update({
      where: { id: gearId },
      data: {
        totalDistance: { decrement: activity.distance * 1000 },
        totalDuration: { decrement: activity.duration },
        totalActivities: { decrement: 1 },
      },
    });

    res.json({ message: 'Equipamiento removido de la actividad' });
  } catch (error) {
    console.error('Remove gear error:', error);
    res.status(500).json({ error: 'Error al remover equipamiento' });
  }
}

// Obtener equipamiento que necesita reemplazo
export async function getGearAlerts(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const gear = await prisma.gear.findMany({
      where: {
        userId: req.user.userId,
        status: 'ACTIVE',
        maxDistance: { not: null },
      },
    });

    const alerts = gear
      .filter(g => g.maxDistance && g.totalDistance >= g.maxDistance * 0.8) // 80% o más
      .map(g => ({
        id: g.id,
        name: g.name || `${g.brand} ${g.model}`,
        type: g.type,
        totalDistanceKm: g.totalDistance / 1000,
        maxDistanceKm: g.maxDistance! / 1000,
        usagePercent: Math.round((g.totalDistance / g.maxDistance!) * 100),
        needsReplacement: g.totalDistance >= g.maxDistance!,
      }));

    res.json({ alerts });
  } catch (error) {
    console.error('Get gear alerts error:', error);
    res.status(500).json({ error: 'Error al obtener alertas' });
  }
}

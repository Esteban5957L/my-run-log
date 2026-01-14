import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { randomBytes } from 'crypto';
import { addDays } from 'date-fns';

function generateInvitationCode(): string {
  return randomBytes(4).toString('hex').toUpperCase();
}

// Crear invitación (solo coaches)
export async function createInvitation(req: Request, res: Response) {
  try {
    if (!req.user || req.user.role !== 'COACH') {
      return res.status(403).json({ error: 'Solo los entrenadores pueden crear invitaciones' });
    }

    const schema = z.object({
      email: z.string().email().optional(),
      expiresInDays: z.number().min(1).max(30).default(7),
    });

    const validation = schema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: validation.error.flatten().fieldErrors 
      });
    }

    const { email, expiresInDays } = validation.data;

    // Generar código único
    let code: string;
    let exists = true;
    
    while (exists) {
      code = generateInvitationCode();
      const existing = await prisma.invitation.findUnique({ where: { code } });
      exists = !!existing;
    }

    const invitation = await prisma.invitation.create({
      data: {
        coachId: req.user.userId,
        code: code!,
        email,
        expiresAt: addDays(new Date(), expiresInDays),
      }
    });

    res.status(201).json({ 
      invitation,
      inviteLink: `${process.env.FRONTEND_URL}/register?code=${invitation.code}`
    });
  } catch (error) {
    console.error('Create invitation error:', error);
    res.status(500).json({ error: 'Error al crear invitación' });
  }
}

// Obtener mis invitaciones (como coach)
export async function getMyInvitations(req: Request, res: Response) {
  try {
    if (!req.user || req.user.role !== 'COACH') {
      return res.status(403).json({ error: 'Solo los entrenadores pueden ver invitaciones' });
    }

    const invitations = await prisma.invitation.findMany({
      where: { coachId: req.user.userId },
      orderBy: { createdAt: 'desc' }
    });

    // Actualizar invitaciones expiradas
    const now = new Date();
    const expiredIds = invitations
      .filter(inv => inv.status === 'PENDING' && inv.expiresAt < now)
      .map(inv => inv.id);

    if (expiredIds.length > 0) {
      await prisma.invitation.updateMany({
        where: { id: { in: expiredIds } },
        data: { status: 'EXPIRED' }
      });
    }

    // Refetch para tener datos actualizados
    const updatedInvitations = await prisma.invitation.findMany({
      where: { coachId: req.user.userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ invitations: updatedInvitations });
  } catch (error) {
    console.error('Get invitations error:', error);
    res.status(500).json({ error: 'Error al obtener invitaciones' });
  }
}

// Verificar código de invitación (público)
export async function verifyInvitation(req: Request, res: Response) {
  try {
    const { code } = req.params;

    const invitation = await prisma.invitation.findUnique({
      where: { code },
      include: {
        coach: {
          select: { id: true, name: true, avatar: true }
        }
      }
    });

    if (!invitation) {
      return res.status(404).json({ error: 'Código de invitación no válido' });
    }

    if (invitation.status !== 'PENDING') {
      return res.status(400).json({ error: 'Esta invitación ya fue usada o cancelada' });
    }

    if (invitation.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Esta invitación ha expirado' });
    }

    res.json({ 
      valid: true,
      coach: invitation.coach,
      email: invitation.email,
    });
  } catch (error) {
    console.error('Verify invitation error:', error);
    res.status(500).json({ error: 'Error al verificar invitación' });
  }
}

// Cancelar invitación
export async function cancelInvitation(req: Request, res: Response) {
  try {
    if (!req.user || req.user.role !== 'COACH') {
      return res.status(403).json({ error: 'Solo los entrenadores pueden cancelar invitaciones' });
    }

    const { invitationId } = req.params;

    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId }
    });

    if (!invitation || invitation.coachId !== req.user.userId) {
      return res.status(404).json({ error: 'Invitación no encontrada' });
    }

    if (invitation.status !== 'PENDING') {
      return res.status(400).json({ error: 'Solo se pueden cancelar invitaciones pendientes' });
    }

    await prisma.invitation.update({
      where: { id: invitationId },
      data: { status: 'CANCELLED' }
    });

    res.json({ message: 'Invitación cancelada' });
  } catch (error) {
    console.error('Cancel invitation error:', error);
    res.status(500).json({ error: 'Error al cancelar invitación' });
  }
}

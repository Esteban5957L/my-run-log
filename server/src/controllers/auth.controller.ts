import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import { UserRole } from '@prisma/client';

// Schemas de validación
const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  role: z.enum(['COACH', 'ATHLETE']).default('ATHLETE'),
  invitationCode: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

function generateToken(userId: string, email: string, role: UserRole): string {
  return jwt.sign(
    { userId, email, role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
}

export async function register(req: Request, res: Response) {
  try {
    const validation = registerSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: validation.error.flatten().fieldErrors 
      });
    }

    const { email, password, name, role, invitationCode } = validation.data;

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    let coachId: string | null = null;

    // Si es atleta y tiene código de invitación, verificarlo
    if (role === 'ATHLETE' && invitationCode) {
      const invitation = await prisma.invitation.findUnique({
        where: { code: invitationCode }
      });

      if (!invitation) {
        return res.status(400).json({ error: 'Código de invitación inválido' });
      }

      if (invitation.status !== 'PENDING') {
        return res.status(400).json({ error: 'El código de invitación ya fue usado o expiró' });
      }

      if (invitation.expiresAt < new Date()) {
        await prisma.invitation.update({
          where: { id: invitation.id },
          data: { status: 'EXPIRED' }
        });
        return res.status(400).json({ error: 'El código de invitación ha expirado' });
      }

      coachId = invitation.coachId;

      // Marcar invitación como usada
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { 
          status: 'ACCEPTED',
          usedAt: new Date(),
          usedByEmail: email
        }
      });
    }

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 12);

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role,
        coachId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        coachId: true,
        createdAt: true,
      }
    });

    // Generar token
    const token = generateToken(user.id, user.email, user.role);

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user,
      token,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const validation = loginSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: validation.error.flatten().fieldErrors 
      });
    }

    const { email, password } = validation.data;

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        coach: {
          select: { id: true, name: true }
        }
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar token
    const token = generateToken(user.id, user.email, user.role);

    res.json({
      message: 'Login exitoso',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        coachId: user.coachId,
        coach: user.coach,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
}

export async function me(req: Request, res: Response) {
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
        coachId: true,
        createdAt: true,
        coach: {
          select: { id: true, name: true, avatar: true }
        },
        stravaToken: {
          select: { stravaAthleteId: true }
        },
        _count: {
          select: { 
            athletes: true,
            activities: true,
            assignedPlans: true 
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Me error:', error);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
}

export async function changePassword(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const schema = z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(8),
    });

    const validation = schema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: validation.error.flatten().fieldErrors 
      });
    }

    const { currentPassword, newPassword } = validation.data;

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash }
    });

    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Error al cambiar contraseña' });
  }
}

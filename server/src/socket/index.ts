import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../config/database.js';
import { JwtPayload } from '../middleware/auth.middleware.js';

interface AuthenticatedSocket extends Socket {
  user?: JwtPayload;
}

// Mapa de usuarios conectados: { oderId: Set<socketId> }
const connectedUsers = new Map<string, Set<string>>();

export function setupSocket(io: Server) {
  // Middleware de autenticación
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, role: true }
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = {
        userId: user.id,
        email: user.email,
        role: user.role
      };

      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.user?.userId;
    
    if (!userId) {
      socket.disconnect();
      return;
    }

    console.log(`User connected: ${userId}`);

    // Agregar a usuarios conectados
    if (!connectedUsers.has(userId)) {
      connectedUsers.set(userId, new Set());
    }
    connectedUsers.get(userId)!.add(socket.id);

    // Unirse a sala personal
    socket.join(`user:${userId}`);

    // Enviar mensaje
    socket.on('message:send', async (data: { receiverId: string; content: string; activityId?: string }) => {
      try {
        const { receiverId, content, activityId } = data;

        // Verificar permisos de chat
        const receiver = await prisma.user.findUnique({
          where: { id: receiverId }
        });

        if (!receiver) {
          socket.emit('error', { message: 'Usuario no encontrado' });
          return;
        }

        // Verificar relación coach-atleta
        let canChat = false;
        if (socket.user?.role === 'COACH') {
          canChat = receiver.coachId === userId;
        } else {
          const currentUser = await prisma.user.findUnique({
            where: { id: userId }
          });
          canChat = currentUser?.coachId === receiverId;
        }

        if (!canChat) {
          socket.emit('error', { message: 'No puedes enviar mensajes a este usuario' });
          return;
        }

        // Crear mensaje
        const message = await prisma.message.create({
          data: {
            senderId: userId,
            receiverId,
            content,
            activityId,
          },
          include: {
            sender: {
              select: { id: true, name: true, avatar: true }
            }
          }
        });

        // Enviar al remitente
        socket.emit('message:sent', message);

        // Enviar al receptor si está conectado
        io.to(`user:${receiverId}`).emit('message:received', message);

      } catch (error) {
        console.error('Socket message error:', error);
        socket.emit('error', { message: 'Error al enviar mensaje' });
      }
    });

    // Marcar mensajes como leídos
    socket.on('message:read', async (data: { senderId: string }) => {
      try {
        await prisma.message.updateMany({
          where: {
            senderId: data.senderId,
            receiverId: userId,
            readAt: null,
          },
          data: { readAt: new Date() }
        });

        // Notificar al remitente que sus mensajes fueron leídos
        io.to(`user:${data.senderId}`).emit('message:read', { 
          readBy: userId,
          readAt: new Date() 
        });

      } catch (error) {
        console.error('Socket read error:', error);
      }
    });

    // Indicador de "escribiendo"
    socket.on('typing:start', (data: { receiverId: string }) => {
      io.to(`user:${data.receiverId}`).emit('typing:start', { userId });
    });

    socket.on('typing:stop', (data: { receiverId: string }) => {
      io.to(`user:${data.receiverId}`).emit('typing:stop', { userId });
    });

    // Desconexión
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${userId}`);
      
      const userSockets = connectedUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          connectedUsers.delete(userId);
        }
      }
    });
  });

  console.log('✅ Socket.io configured');
}

// Función para verificar si un usuario está online
export function isUserOnline(userId: string): boolean {
  return connectedUsers.has(userId) && connectedUsers.get(userId)!.size > 0;
}

// Función para enviar notificación a un usuario
export function notifyUser(io: Server, userId: string, event: string, data: any) {
  io.to(`user:${userId}`).emit(event, data);
}

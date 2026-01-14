import { io, Socket } from 'socket.io-client';
import type { Message } from '@/types/message';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

class SocketService {
  private socket: Socket | null = null;
  private messageHandlers: ((message: Message) => void)[] = [];
  private typingHandlers: ((data: { oderId: string; isTyping: boolean }) => void)[] = [];
  private readHandlers: ((data: { oderId: string; messageIds: string[] }) => void)[] = [];

  connect(token: string): void {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('🔌 Socket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
    });

    this.socket.on('new_message', (message: Message) => {
      this.messageHandlers.forEach(handler => handler(message));
    });

    this.socket.on('user_typing', (data: { oderId: string; isTyping: boolean }) => {
      this.typingHandlers.forEach(handler => handler(data));
    });

    this.socket.on('messages_read', (data: { oderId: string; messageIds: string[] }) => {
      this.readHandlers.forEach(handler => handler(data));
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  sendMessage(receiverId: string, content: string): void {
    if (this.socket?.connected) {
      this.socket.emit('send_message', { receiverId, content });
    }
  }

  sendTyping(receiverId: string, isTyping: boolean): void {
    if (this.socket?.connected) {
      this.socket.emit('typing', { receiverId, isTyping });
    }
  }

  markAsRead(senderId: string, messageIds: string[]): void {
    if (this.socket?.connected) {
      this.socket.emit('mark_read', { senderId, messageIds });
    }
  }

  onMessage(handler: (message: Message) => void): () => void {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    };
  }

  onTyping(handler: (data: { oderId: string; isTyping: boolean }) => void): () => void {
    this.typingHandlers.push(handler);
    return () => {
      this.typingHandlers = this.typingHandlers.filter(h => h !== handler);
    };
  }

  onMessagesRead(handler: (data: { oderId: string; messageIds: string[] }) => void): () => void {
    this.readHandlers.push(handler);
    return () => {
      this.readHandlers = this.readHandlers.filter(h => h !== handler);
    };
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const socketService = new SocketService();

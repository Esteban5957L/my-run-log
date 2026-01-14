import { api } from './api';
import type { Message, ConversationListItem } from '@/types/message';

export const messageService = {
  async getConversations(): Promise<{ conversations: ConversationListItem[] }> {
    return api.get<{ conversations: ConversationListItem[] }>('/messages/conversations');
  },

  async getMessages(otherId: string, limit = 50, before?: string): Promise<{ messages: Message[]; hasMore: boolean }> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (before) params.append('before', before);
    
    return api.get<{ messages: Message[]; hasMore: boolean }>(`/messages/${otherId}?${params.toString()}`);
  },

  async sendMessage(receiverId: string, content: string): Promise<{ message: Message }> {
    return api.post<{ message: Message }>('/messages', { receiverId, content });
  },

  async markAsRead(senderId: string): Promise<void> {
    await api.post(`/messages/${senderId}/read`);
  },

  async getUnreadCount(): Promise<{ count: number }> {
    return api.get<{ count: number }>('/messages/unread/count');
  },
};

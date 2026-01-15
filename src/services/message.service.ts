import { api } from './api';
import type { Message, ConversationListItem } from '@/types/message';

export interface SendMessageData {
  receiverId: string;
  content?: string;
  activityId?: string;
  attachmentUrl?: string;
  attachmentType?: 'image' | 'file';
  attachmentName?: string;
}

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

  async sendMessage(data: SendMessageData): Promise<{ message: Message }> {
    return api.post<{ message: Message }>('/messages', data);
  },

  async markAsRead(senderId: string): Promise<void> {
    await api.post(`/messages/${senderId}/read`);
  },

  async getUnreadCount(): Promise<{ count: number }> {
    return api.get<{ count: number }>('/messages/unread/count');
  },

  async addReaction(messageId: string, emoji: string): Promise<{ message: Message }> {
    return api.post<{ message: Message }>(`/messages/${messageId}/reaction`, { emoji });
  },
};

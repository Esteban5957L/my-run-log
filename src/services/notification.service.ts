import { api } from './api';

export type NotificationType = 
  | 'PLAN_ASSIGNED'
  | 'SESSION_COMPLETED'
  | 'SESSION_SKIPPED'
  | 'ACTIVITY_SYNCED'
  | 'COACH_FEEDBACK'
  | 'MESSAGE_RECEIVED'
  | 'STREAK_MILESTONE';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  planId?: string;
  sessionId?: string;
  activityId?: string;
  fromUserId?: string;
  read: boolean;
  readAt?: string;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
}

export const notificationService = {
  async getNotifications(limit = 20, offset = 0, unreadOnly = false): Promise<NotificationsResponse> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());
    if (unreadOnly) params.append('unreadOnly', 'true');
    
    return api.get<NotificationsResponse>(`/notifications?${params.toString()}`);
  },

  async getUnreadCount(): Promise<{ count: number }> {
    return api.get<{ count: number }>('/notifications/unread-count');
  },

  async markAsRead(notificationId: string): Promise<{ notification: Notification }> {
    return api.patch<{ notification: Notification }>(`/notifications/${notificationId}/read`);
  },

  async markAllAsRead(): Promise<{ message: string }> {
    return api.post<{ message: string }>('/notifications/mark-all-read');
  },

  async deleteNotification(notificationId: string): Promise<void> {
    await api.delete(`/notifications/${notificationId}`);
  },
};

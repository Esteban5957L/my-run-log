import { api } from './api';
import type { Activity } from '@/types/activity';

interface GetActivitiesParams {
  userId?: string;
  from?: string;
  to?: string;
  type?: string;
  limit?: number;
  offset?: number;
}

export const activityService = {
  async getActivities(params: GetActivitiesParams = {}): Promise<{ activities: Activity[]; total: number }> {
    const searchParams = new URLSearchParams();
    if (params.userId) searchParams.append('userId', params.userId);
    if (params.from) searchParams.append('from', params.from);
    if (params.to) searchParams.append('to', params.to);
    if (params.type) searchParams.append('type', params.type);
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.offset) searchParams.append('offset', params.offset.toString());
    
    const query = searchParams.toString();
    return api.get<{ activities: Activity[]; total: number }>(`/activities${query ? `?${query}` : ''}`);
  },

  async getActivity(activityId: string): Promise<{ activity: Activity }> {
    return api.get<{ activity: Activity }>(`/activities/${activityId}`);
  },

  async createActivity(data: Partial<Activity>): Promise<{ activity: Activity }> {
    return api.post<{ activity: Activity }>('/activities', data);
  },

  async updateActivity(activityId: string, data: Partial<Activity>): Promise<{ activity: Activity }> {
    return api.put<{ activity: Activity }>(`/activities/${activityId}`, data);
  },

  async deleteActivity(activityId: string): Promise<void> {
    await api.delete(`/activities/${activityId}`);
  },

  async addCoachFeedback(activityId: string, feedback: string): Promise<{ activity: Activity }> {
    return api.patch<{ activity: Activity }>(`/activities/${activityId}/feedback`, { coachFeedback: feedback });
  },

  async getMyActivities(limit = 10): Promise<{ activities: Activity[] }> {
    return api.get<{ activities: Activity[] }>(`/activities?limit=${limit}`);
  },

  async getAthleteActivities(athleteId: string, limit = 10): Promise<{ activities: Activity[] }> {
    return api.get<{ activities: Activity[] }>(`/activities?userId=${athleteId}&limit=${limit}`);
  },
};

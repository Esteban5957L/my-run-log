import { api } from './api';

interface StravaStatus {
  connected: boolean;
  stravaAthleteId: string | null;
  lastSync: string | null;
}

interface SyncResult {
  message: string;
  syncedActivities: number;
}

export const stravaService = {
  async getStatus(): Promise<StravaStatus> {
    return api.get<StravaStatus>('/strava/status');
  },

  async getAuthUrl(): Promise<{ authUrl: string }> {
    return api.get<{ authUrl: string }>('/strava/auth');
  },

  async sync(): Promise<SyncResult> {
    return api.post<SyncResult>('/strava/sync');
  },

  async disconnect(): Promise<{ message: string }> {
    return api.delete<{ message: string }>('/strava/disconnect');
  },
};

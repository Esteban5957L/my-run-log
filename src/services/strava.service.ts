import { api } from './api';

interface StravaStatus {
  connected: boolean;
  stravaAthleteId: string | null;
  lastSync: string | null;
}

interface SyncResult {
  message: string;
  syncedActivities: number;
  linkedToPlans?: number;
}

interface SyncAllResult {
  message: string;
  totalSynced: number;
  totalLinked: number;
  athletesSynced: number;
  totalAthletes: number;
  errors?: string[];
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

  // Sincronizar todos los atletas (solo para coaches)
  async syncAllAthletes(): Promise<SyncAllResult> {
    return api.post<SyncAllResult>('/strava/sync-all');
  },

  async disconnect(): Promise<{ message: string }> {
    return api.delete<{ message: string }>('/strava/disconnect');
  },
};

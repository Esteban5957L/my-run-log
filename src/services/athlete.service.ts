import { api } from './api';
import type { Athlete, AthleteDetail } from '@/types/athlete';

export const athleteService = {
  async getMyAthletes(): Promise<{ athletes: Athlete[] }> {
    return api.get<{ athletes: Athlete[] }>('/athletes');
  },

  async getAthleteDetail(athleteId: string): Promise<AthleteDetail> {
    return api.get<AthleteDetail>(`/athletes/${athleteId}`);
  },

  async removeAthlete(athleteId: string): Promise<void> {
    await api.delete(`/athletes/${athleteId}`);
  },
};

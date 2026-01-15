import { api } from './api';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'COACH' | 'ATHLETE';
  avatar?: string | null;
  birthDate?: string | null;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
  weight?: number | null;
  height?: number | null;
  bio?: string | null;
  location?: string | null;
  hrZone1?: number | null;
  hrZone2?: number | null;
  hrZone3?: number | null;
  hrZone4?: number | null;
  hrZone5?: number | null;
  hrMax?: number | null;
  hrRest?: number | null;
  createdAt: string;
  coach?: { id: string; name: string; avatar?: string | null } | null;
  stravaConnected: boolean;
  totalStats: {
    distance: number;
    duration: number;
    elevation: number;
    activities: number;
  };
  _count: {
    activities: number;
    goals: number;
    gear: number;
  };
}

export interface UpdateProfileData {
  name?: string;
  avatar?: string | null;
  birthDate?: string | null;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
  weight?: number | null;
  height?: number | null;
  bio?: string | null;
  location?: string | null;
  hrZone1?: number | null;
  hrZone2?: number | null;
  hrZone3?: number | null;
  hrZone4?: number | null;
  hrZone5?: number | null;
  hrMax?: number | null;
  hrRest?: number | null;
}

export interface HRZones {
  hrMax: number;
  hrRest: number;
  hrZone1: number;
  hrZone2: number;
  hrZone3: number;
  hrZone4: number;
  hrZone5: number;
}

export const profileService = {
  async getProfile(): Promise<{ profile: UserProfile }> {
    return api.get<{ profile: UserProfile }>('/profile');
  },

  async updateProfile(data: UpdateProfileData): Promise<{ profile: UserProfile }> {
    return api.put<{ profile: UserProfile }>('/profile', data);
  },

  async calculateHRZones(hrMax: number, hrRest?: number): Promise<{ zones: HRZones }> {
    return api.post<{ zones: HRZones }>('/profile/hr-zones', { hrMax, hrRest });
  },
};

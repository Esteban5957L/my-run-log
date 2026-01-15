import { api } from './api';

export type RaceType = 'FIVE_K' | 'TEN_K' | 'HALF_MARATHON' | 'MARATHON' | 'ULTRA' | 'TRAIL' | 'TRACK' | 'OTHER';
export type RaceStatus = 'UPCOMING' | 'COMPLETED' | 'CANCELLED' | 'DNF';

export interface Race {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  raceType: RaceType;
  distance: number;
  date: string;
  location?: string | null;
  website?: string | null;
  locationLat?: number | null;
  locationLng?: number | null;
  targetTime?: number | null;
  targetPace?: number | null;
  status: RaceStatus;
  actualTime?: number | null;
  actualPace?: number | null;
  position?: number | null;
  categoryPosition?: number | null;
  category?: string | null;
  activityId?: string | null;
  trainingPlanId?: string | null;
  notes?: string | null;
  coachFeedback?: string | null;
  photoUrl?: string | null;
  medalUrl?: string | null;
  createdAt: string;
  updatedAt: string;

  // Relaciones
  activity?: {
    id: string;
    name: string;
    date: string;
    distance: number;
    duration: number;
    avgPace?: number | null;
  };
  trainingPlan?: {
    id: string;
    name: string;
    status: string;
  };

  // Campos calculados
  daysUntil: number;
  progressPercent: number;
}

export interface CreateRaceData {
  name: string;
  description?: string;
  raceType: RaceType;
  distance: number;
  date: string;
  location?: string;
  website?: string;
  locationLat?: number;
  locationLng?: number;
  targetTime?: number;
  trainingPlanId?: string;
  notes?: string;
}

export interface UpdateRaceData {
  name?: string;
  description?: string | null;
  raceType?: RaceType;
  distance?: number;
  date?: string;
  location?: string | null;
  website?: string | null;
  locationLat?: number | null;
  locationLng?: number | null;
  targetTime?: number | null;
  status?: RaceStatus;
  actualTime?: number | null;
  position?: number | null;
  categoryPosition?: number | null;
  category?: string | null;
  activityId?: string | null;
  trainingPlanId?: string | null;
  notes?: string | null;
  coachFeedback?: string | null;
  photoUrl?: string | null;
  medalUrl?: string | null;
}

export const raceService = {
  async getRaces(includeCompleted = false): Promise<{ races: Race[] }> {
    const params = includeCompleted ? '?includeCompleted=true' : '';
    return api.get<{ races: Race[] }>(`/races${params}`);
  },

  async getRaceById(raceId: string): Promise<{ race: Race }> {
    return api.get<{ race: Race }>(`/races/${raceId}`);
  },

  async createRace(data: CreateRaceData): Promise<{ race: Race }> {
    return api.post<{ race: Race }>('/races', data);
  },

  async updateRace(raceId: string, data: UpdateRaceData): Promise<{ race: Race }> {
    return api.put<{ race: Race }>(`/races/${raceId}`, data);
  },

  async deleteRace(raceId: string): Promise<void> {
    await api.delete(`/races/${raceId}`);
  },

  async linkActivityToRace(raceId: string, activityId: string): Promise<void> {
    await api.post(`/races/${raceId}/activity`, { activityId });
  },
};

// Constantes para UI
export const RACE_TYPE_CONFIG: Record<RaceType, { label: string; icon: string; color: string; description: string }> = {
  FIVE_K: {
    label: '5K',
    icon: '🏃',
    color: 'text-blue-500',
    description: 'Carrera de 5 kilómetros'
  },
  TEN_K: {
    label: '10K',
    icon: '🏃‍♂️',
    color: 'text-green-500',
    description: 'Carrera de 10 kilómetros'
  },
  HALF_MARATHON: {
    label: 'Media Maratón',
    icon: '🏃‍♀️',
    color: 'text-purple-500',
    description: 'Media maratón (21.1 km)'
  },
  MARATHON: {
    label: 'Maratón',
    icon: '🏃',
    color: 'text-red-500',
    description: 'Maratón completo (42.2 km)'
  },
  ULTRA: {
    label: 'Ultra',
    icon: '🏔️',
    color: 'text-orange-500',
    description: 'Ultra maratón'
  },
  TRAIL: {
    label: 'Trail',
    icon: '🌲',
    color: 'text-green-600',
    description: 'Carrera de trail running'
  },
  TRACK: {
    label: 'Pista',
    icon: '🏟️',
    color: 'text-indigo-500',
    description: 'Carrera en pista'
  },
  OTHER: {
    label: 'Otra',
    icon: '🎯',
    color: 'text-gray-500',
    description: 'Otra distancia'
  },
};

export const RACE_STATUS_LABELS: Record<RaceStatus, string> = {
  UPCOMING: 'Próxima',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
  DNF: 'DNF (No terminó)',
};

export const RACE_STATUS_COLORS: Record<RaceStatus, string> = {
  UPCOMING: 'text-blue-500',
  COMPLETED: 'text-green-500',
  CANCELLED: 'text-gray-500',
  DNF: 'text-orange-500',
};
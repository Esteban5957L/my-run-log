import { api } from './api';

export type GearType = 'SHOES' | 'WATCH' | 'HEART_RATE' | 'CLOTHING' | 'OTHER';
export type GearStatus = 'ACTIVE' | 'RETIRED';

export interface Gear {
  id: string;
  userId: string;
  type: GearType;
  status: GearStatus;
  brand: string;
  model: string;
  name?: string | null;
  totalDistance: number;
  totalDuration: number;
  totalActivities: number;
  maxDistance?: number | null;
  purchaseDate?: string | null;
  retiredDate?: string | null;
  notes?: string | null;
  imageUrl?: string | null;
  createdAt: string;
  // Campos calculados
  totalDistanceKm: number;
  maxDistanceKm?: number | null;
  needsReplacement: boolean;
  usagePercent?: number | null;
  _count?: { activities: number };
}

export interface GearWithActivities extends Gear {
  recentActivities: Array<{
    id: string;
    name: string;
    date: string;
    distance: number;
    duration: number;
    activityType: string;
  }>;
}

export interface CreateGearData {
  type: GearType;
  brand: string;
  model: string;
  name?: string;
  maxDistance?: number; // en km
  purchaseDate?: string;
  notes?: string;
  imageUrl?: string;
}

export interface UpdateGearData {
  brand?: string;
  model?: string;
  name?: string | null;
  maxDistance?: number | null;
  purchaseDate?: string | null;
  notes?: string | null;
  imageUrl?: string | null;
  status?: GearStatus;
}

export interface GearAlert {
  id: string;
  name: string;
  type: GearType;
  totalDistanceKm: number;
  maxDistanceKm: number;
  usagePercent: number;
  needsReplacement: boolean;
}

export const gearService = {
  async getGear(status?: GearStatus, type?: GearType): Promise<{ gear: Gear[] }> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (type) params.append('type', type);
    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get<{ gear: Gear[] }>(`/gear${query}`);
  },

  async getGearById(gearId: string): Promise<{ gear: GearWithActivities }> {
    return api.get<{ gear: GearWithActivities }>(`/gear/${gearId}`);
  },

  async createGear(data: CreateGearData): Promise<{ gear: Gear }> {
    return api.post<{ gear: Gear }>('/gear', data);
  },

  async updateGear(gearId: string, data: UpdateGearData): Promise<{ gear: Gear }> {
    return api.put<{ gear: Gear }>(`/gear/${gearId}`, data);
  },

  async deleteGear(gearId: string): Promise<void> {
    await api.delete(`/gear/${gearId}`);
  },

  async assignGearToActivity(activityId: string, gearId: string): Promise<void> {
    await api.post(`/gear/activity/${activityId}`, { gearId });
  },

  async removeGearFromActivity(activityId: string, gearId: string): Promise<void> {
    await api.delete(`/gear/activity/${activityId}/${gearId}`);
  },

  async getGearAlerts(): Promise<{ alerts: GearAlert[] }> {
    return api.get<{ alerts: GearAlert[] }>('/gear/alerts');
  },
};

// Constantes para UI
export const GEAR_TYPE_CONFIG: Record<GearType, { label: string; icon: string; color: string }> = {
  SHOES: { label: 'Zapatillas', icon: '👟', color: 'text-orange-500' },
  WATCH: { label: 'Reloj/GPS', icon: '⌚', color: 'text-blue-500' },
  HEART_RATE: { label: 'Banda FC', icon: '❤️', color: 'text-red-500' },
  CLOTHING: { label: 'Ropa', icon: '👕', color: 'text-green-500' },
  OTHER: { label: 'Otro', icon: '📦', color: 'text-gray-500' },
};

export const GEAR_STATUS_LABELS: Record<GearStatus, string> = {
  ACTIVE: 'En uso',
  RETIRED: 'Retirado',
};

export type ActivityType = 
  | 'RUNNING' 
  | 'TRAIL' 
  | 'RECOVERY' 
  | 'TEMPO' 
  | 'INTERVALS' 
  | 'LONG_RUN' 
  | 'RACE';

export type TerrainType = 'ASPHALT' | 'TRAIL' | 'MIXED' | 'MOUNTAIN';

export interface Activity {
  id: string;
  userId: string;
  stravaId?: string | null;
  name: string;
  activityType: ActivityType;
  date: string;
  distance: number;
  duration: number;
  elevationGain: number;
  elevationLoss: number;
  avgPace?: number | null;
  avgHeartRate?: number | null;
  maxHeartRate?: number | null;
  calories?: number | null;
  terrainType?: TerrainType | null;
  locationName?: string | null;
  startLat?: number | null;
  startLng?: number | null;
  mapPolyline?: string | null;
  splits?: any;
  notes?: string | null;
  coachFeedback?: string | null;
  perceivedEffort?: number | null;
  planSessionId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  RUNNING: 'Running',
  TRAIL: 'Trail Running',
  RECOVERY: 'Recuperación',
  TEMPO: 'Tempo',
  INTERVALS: 'Series',
  LONG_RUN: 'Tirada Larga',
  RACE: 'Carrera',
};

export const ACTIVITY_TYPE_COLORS: Record<ActivityType, string> = {
  RUNNING: 'hsl(var(--road))',
  TRAIL: 'hsl(var(--trail))',
  RECOVERY: 'hsl(var(--recovery))',
  TEMPO: 'hsl(var(--energy))',
  INTERVALS: 'hsl(var(--summit))',
  LONG_RUN: 'hsl(var(--accent))',
  RACE: 'hsl(var(--secondary))',
};

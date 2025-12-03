export type ActivityType = 
  | 'running' 
  | 'trail' 
  | 'recovery' 
  | 'tempo' 
  | 'intervals' 
  | 'long_run' 
  | 'race';

export type TerrainType = 'asphalt' | 'trail' | 'mixed' | 'mountain';

export type WorkoutStatus = 'completed' | 'planned' | 'missed';

export interface Workout {
  id: string;
  date: string;
  time?: string;
  activityType: ActivityType;
  distance: number; // km
  duration: number; // seconds
  elevationGain: number; // meters
  elevationLoss: number; // meters
  avgPace?: number; // seconds per km
  avgHeartRate?: number;
  maxHeartRate?: number;
  perceivedEffort?: number; // 1-10
  weather?: string;
  temperature?: number;
  terrainType?: TerrainType;
  locationName?: string;
  locationLat?: number;
  locationLng?: number;
  notes?: string;
  shoeId?: string;
  gpxFileUrl?: string;
  stravaActivityId?: string;
  status: WorkoutStatus;
  plannedWorkoutId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Race {
  id: string;
  name: string;
  date: string;
  distance: number;
  expectedElevation: number;
  targetTime?: number; // seconds
  location: string;
  locationLat?: number;
  locationLng?: number;
  raceUrl?: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  actualWorkoutId?: string;
  createdAt: string;
}

export interface Shoe {
  id: string;
  brand: string;
  model: string;
  purchaseDate: string;
  totalKm: number;
  maxKmRecommended: number;
  shoeType: 'road' | 'trail' | 'mixed';
  status: 'active' | 'retired';
  createdAt: string;
}

export interface WeeklyStats {
  weekStart: string;
  totalDistance: number;
  totalElevation: number;
  totalDuration: number;
  workoutCount: number;
  avgPace: number;
}

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  running: 'Running',
  trail: 'Trail Running',
  recovery: 'Recovery',
  tempo: 'Tempo',
  intervals: 'Intervals',
  long_run: 'Long Run',
  race: 'Race',
};

export const ACTIVITY_COLORS: Record<ActivityType, string> = {
  running: 'hsl(var(--road))',
  trail: 'hsl(var(--trail))',
  recovery: 'hsl(var(--recovery))',
  tempo: 'hsl(var(--energy))',
  intervals: 'hsl(var(--summit))',
  long_run: 'hsl(var(--accent))',
  race: 'hsl(var(--secondary))',
};

export const TERRAIN_LABELS: Record<TerrainType, string> = {
  asphalt: 'Asfalto',
  trail: 'Trail',
  mixed: 'Mixto',
  mountain: 'Montaña',
};

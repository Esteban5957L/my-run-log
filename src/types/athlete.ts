import { Activity } from './activity';

export interface Athlete {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  createdAt: string;
  stravaConnected: boolean;
  lastActivity?: {
    id: string;
    date: string;
    name: string;
    distance: number;
    duration: number;
  } | null;
  daysSinceLastActivity: number | null;
  weeklyStats: {
    distance: number;
    duration: number;
    elevation: number;
    workouts: number;
  };
  _count?: {
    activities: number;
  };
}

export interface AthleteDetail {
  athlete: Athlete;
  stats: {
    monthly: {
      distance: number;
      duration: number;
      elevation: number;
      workouts: number;
      avgPace?: number | null;
      avgHeartRate?: number | null;
    };
    weekly: {
      distance: number;
      duration: number;
      elevation: number;
      workouts: number;
    };
  };
  recentActivities: Activity[];
  activePlans: any[];
}

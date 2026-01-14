import { api } from './api';
import type { Activity } from '@/types/activity';

interface DashboardStats {
  weekly: {
    distance: number;
    duration: number;
    elevation: number;
    workouts: number;
    avgPace: number | null;
  };
  monthly: {
    distance: number;
    duration: number;
    elevation: number;
    workouts: number;
    avgPace: number | null;
    avgHeartRate: number | null;
  };
  weeklyProgress: {
    day: string;
    distance: number;
    duration: number;
  }[];
  streakDays: number;
  totalDistance: number;
  totalWorkouts: number;
}

interface ActivePlan {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  status: string;
  coach: {
    id: string;
    name: string;
    avatar: string | null;
  };
  sessions: {
    id: string;
    dayOfWeek: number;
    sessionType: string;
    targetDistance: number | null;
    targetDuration: number | null;
    targetPace: number | null;
    description: string | null;
    completed: boolean;
    completedAt: string | null;
  }[];
  completedSessions: number;
  totalSessions: number;
  progressPercent: number;
}

interface AthleteDashboardData {
  stats: DashboardStats;
  recentActivities: Activity[];
  activePlan: ActivePlan | null;
  coach: {
    id: string;
    name: string;
    avatar: string | null;
  } | null;
  stravaConnected: boolean;
  unreadMessages: number;
}

export const dashboardService = {
  async getAthleteDashboard(): Promise<AthleteDashboardData> {
    return api.get<AthleteDashboardData>('/users/dashboard');
  },

  async getMyActivities(limit = 10): Promise<{ activities: Activity[]; total: number }> {
    return api.get<{ activities: Activity[]; total: number }>(`/activities?limit=${limit}`);
  },

  async getMyPlans(): Promise<{ plans: ActivePlan[] }> {
    return api.get<{ plans: ActivePlan[] }>('/plans/my');
  },
};

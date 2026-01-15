import { api } from './api';

export type GoalType = 'DISTANCE' | 'DURATION' | 'WORKOUTS' | 'ELEVATION' | 'STREAK';
export type GoalPeriod = 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM';
export type GoalStatus = 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface Goal {
  id: string;
  userId: string;
  type: GoalType;
  period: GoalPeriod;
  status: GoalStatus;
  title: string;
  description?: string | null;
  targetValue: number;
  currentValue: number;
  startDate: string;
  endDate: string;
  progressPercent: number;
  daysRemaining: number;
  completedAt?: string | null;
  createdAt: string;
}

export interface CreateGoalData {
  type: GoalType;
  period: GoalPeriod;
  title: string;
  description?: string;
  targetValue: number;
  startDate?: string;
  endDate?: string;
}

export interface MonthlyStats {
  month: string;
  year: number;
  distance: number;
  duration: number;
  elevation: number;
  workouts: number;
  avgPace: number | null;
  avgHeartRate: number | null;
}

export interface WeeklyStats {
  week: string;
  startDate: string;
  distance: number;
  duration: number;
  workouts: number;
}

export interface HistoricalStatsResponse {
  monthly: MonthlyStats[];
  weekly: WeeklyStats[];
  comparison: {
    distance: number;
    duration: number;
    workouts: number;
  };
}

export const goalService = {
  async getGoals(includeCompleted = false): Promise<{ goals: Goal[] }> {
    const params = includeCompleted ? '?includeCompleted=true' : '';
    return api.get<{ goals: Goal[] }>(`/goals${params}`);
  },

  async createGoal(data: CreateGoalData): Promise<{ goal: Goal }> {
    return api.post<{ goal: Goal }>('/goals', data);
  },

  async updateGoal(goalId: string, data: Partial<Goal>): Promise<{ goal: Goal }> {
    return api.put<{ goal: Goal }>(`/goals/${goalId}`, data);
  },

  async deleteGoal(goalId: string): Promise<void> {
    await api.delete(`/goals/${goalId}`);
  },

  async getHistoricalStats(months = 6): Promise<HistoricalStatsResponse> {
    return api.get<HistoricalStatsResponse>(`/goals/stats/historical?months=${months}`);
  },
};

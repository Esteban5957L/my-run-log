export type SessionType = 
  | 'EASY'
  | 'TEMPO'
  | 'INTERVALS'
  | 'LONG_RUN'
  | 'RECOVERY'
  | 'RACE'
  | 'REST'
  | 'CROSS_TRAINING';

export type PlanStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface PlanSession {
  id: string;
  planId: string;
  date: string;
  sessionType: SessionType;
  targetDistance?: number;
  targetDuration?: number;
  targetPace?: number;
  title: string;
  description?: string;
  warmup?: string;
  mainWorkout?: string;
  cooldown?: string;
  completed: boolean;
  skipped: boolean;
  activities?: {
    id: string;
    name: string;
    distance: number;
    duration: number;
    avgPace?: number;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface TrainingPlan {
  id: string;
  coachId: string;
  athleteId: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: PlanStatus;
  sessions: PlanSession[];
  athlete: {
    id: string;
    name: string;
    avatar?: string;
    email?: string;
  };
  coach: {
    id: string;
    name: string;
  };
  _count?: {
    sessions: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlanData {
  athleteId: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  sessions?: CreateSessionData[];
}

export interface CreateSessionData {
  date: string;
  sessionType: SessionType;
  title: string;
  description?: string;
  targetDistance?: number;
  targetDuration?: number;
  targetPace?: number;
  warmup?: string;
  mainWorkout?: string;
  cooldown?: string;
}

export interface UpdatePlanData {
  name?: string;
  description?: string;
  status?: PlanStatus;
}

export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  EASY: 'Fácil',
  TEMPO: 'Tempo',
  INTERVALS: 'Series',
  LONG_RUN: 'Fondo',
  RECOVERY: 'Recuperación',
  RACE: 'Carrera',
  REST: 'Descanso',
  CROSS_TRAINING: 'Cross Training',
};

export const SESSION_TYPE_COLORS: Record<SessionType, string> = {
  EASY: 'bg-green-500',
  TEMPO: 'bg-orange-500',
  INTERVALS: 'bg-red-500',
  LONG_RUN: 'bg-blue-500',
  RECOVERY: 'bg-teal-500',
  RACE: 'bg-purple-500',
  REST: 'bg-gray-500',
  CROSS_TRAINING: 'bg-yellow-500',
};

export const PLAN_STATUS_LABELS: Record<PlanStatus, string> = {
  DRAFT: 'Borrador',
  ACTIVE: 'Activo',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
};

export const PLAN_STATUS_COLORS: Record<PlanStatus, string> = {
  DRAFT: 'bg-gray-500',
  ACTIVE: 'bg-green-500',
  COMPLETED: 'bg-blue-500',
  CANCELLED: 'bg-red-500',
};

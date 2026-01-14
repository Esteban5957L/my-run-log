export type UserRole = 'COACH' | 'ATHLETE';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string | null;
  coachId?: string | null;
  coach?: {
    id: string;
    name: string;
    avatar?: string | null;
  } | null;
  stravaToken?: {
    stravaAthleteId: string;
  } | null;
  _count?: {
    athletes: number;
    activities: number;
    assignedPlans: number;
  };
  createdAt?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  invitationCode?: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

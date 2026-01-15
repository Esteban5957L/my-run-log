import { api } from './api';
import { 
  TrainingPlan, 
  CreatePlanData, 
  UpdatePlanData, 
  PlanSession,
  CreateSessionData 
} from '@/types/plan';

export interface PlansResponse {
  plans: TrainingPlan[];
}

export interface PlanResponse {
  plan: TrainingPlan;
  stats: {
    completedSessions: number;
    totalSessions: number;
    completionRate: number;
  };
}

export const planService = {
  // Obtener todos los planes (como coach o atleta)
  async getPlans(athleteId?: string, status?: string): Promise<PlansResponse> {
    const params = new URLSearchParams();
    if (athleteId) params.append('athleteId', athleteId);
    if (status) params.append('status', status);
    
    return api.get<PlansResponse>(`/plans?${params.toString()}`);
  },

  // Obtener un plan por ID
  async getPlan(planId: string): Promise<PlanResponse> {
    return api.get<PlanResponse>(`/plans/${planId}`);
  },

  // Crear un nuevo plan
  async createPlan(data: CreatePlanData): Promise<{ plan: TrainingPlan }> {
    return api.post<{ plan: TrainingPlan }>('/plans', data);
  },

  // Actualizar un plan
  async updatePlan(planId: string, data: UpdatePlanData): Promise<{ plan: TrainingPlan }> {
    return api.put<{ plan: TrainingPlan }>(`/plans/${planId}`, data);
  },

  // Eliminar un plan
  async deletePlan(planId: string): Promise<void> {
    await api.delete(`/plans/${planId}`);
  },

  // Agregar una sesión a un plan
  async addSession(planId: string, data: CreateSessionData): Promise<{ session: PlanSession }> {
    return api.post<{ session: PlanSession }>(`/plans/${planId}/sessions`, data);
  },

  // Actualizar estado de una sesión
  async updateSessionStatus(
    sessionId: string, 
    data: { completed?: boolean; skipped?: boolean }
  ): Promise<{ session: PlanSession }> {
    return api.patch<{ session: PlanSession }>(`/plans/sessions/${sessionId}`, data);
  },
};

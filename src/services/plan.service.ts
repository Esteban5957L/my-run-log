import api from './api';
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
    
    const response = await api.get(`/plans?${params.toString()}`);
    return response.data;
  },

  // Obtener un plan por ID
  async getPlan(planId: string): Promise<PlanResponse> {
    const response = await api.get(`/plans/${planId}`);
    return response.data;
  },

  // Crear un nuevo plan
  async createPlan(data: CreatePlanData): Promise<{ plan: TrainingPlan }> {
    const response = await api.post('/plans', data);
    return response.data;
  },

  // Actualizar un plan
  async updatePlan(planId: string, data: UpdatePlanData): Promise<{ plan: TrainingPlan }> {
    const response = await api.put(`/plans/${planId}`, data);
    return response.data;
  },

  // Eliminar un plan
  async deletePlan(planId: string): Promise<void> {
    await api.delete(`/plans/${planId}`);
  },

  // Agregar una sesión a un plan
  async addSession(planId: string, data: CreateSessionData): Promise<{ session: PlanSession }> {
    const response = await api.post(`/plans/${planId}/sessions`, data);
    return response.data;
  },

  // Actualizar estado de una sesión
  async updateSessionStatus(
    sessionId: string, 
    data: { completed?: boolean; skipped?: boolean }
  ): Promise<{ session: PlanSession }> {
    const response = await api.patch(`/plans/sessions/${sessionId}`, data);
    return response.data;
  },
};

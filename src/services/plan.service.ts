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

export interface TemplatesResponse {
  templates: TrainingPlan[];
}

export interface CalendarSession extends PlanSession {
  plan: {
    id: string;
    name: string;
    status: string;
    athlete: { id: string; name: string; avatar: string | null };
  };
}

export interface CalendarResponse {
  sessions: CalendarSession[];
  sessionsByDate: Record<string, CalendarSession[]>;
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

  // Duplicar plan a otro atleta
  async duplicatePlan(planId: string, data: { targetAthleteId: string; newName?: string; startDate: string }): Promise<{ plan: TrainingPlan }> {
    return api.post<{ plan: TrainingPlan }>(`/plans/${planId}/duplicate`, data);
  },

  // Crear plantilla desde un plan
  async createTemplate(planId: string, templateName?: string): Promise<{ template: TrainingPlan }> {
    return api.post<{ template: TrainingPlan }>(`/plans/${planId}/create-template`, { templateName });
  },

  // Obtener plantillas
  async getTemplates(): Promise<TemplatesResponse> {
    return api.get<TemplatesResponse>('/plans/templates');
  },

  // Crear plan desde plantilla
  async createPlanFromTemplate(templateId: string, data: { athleteId: string; planName?: string; startDate: string }): Promise<{ plan: TrainingPlan }> {
    return api.post<{ plan: TrainingPlan }>(`/plans/templates/${templateId}/create-plan`, data);
  },

  // Obtener sesiones para el calendario
  async getCalendarSessions(startDate?: string, endDate?: string, athleteId?: string): Promise<CalendarResponse> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (athleteId) params.append('athleteId', athleteId);
    
    return api.get<CalendarResponse>(`/plans/calendar?${params.toString()}`);
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

  // Agregar feedback del coach a una sesión
  async addSessionFeedback(
    sessionId: string,
    data: { coachNotes?: string; coachFeedback?: string }
  ): Promise<{ session: PlanSession }> {
    return api.patch<{ session: PlanSession }>(`/plans/sessions/${sessionId}/feedback`, data);
  },
};

import { api } from './api';
import type { AuthResponse, LoginCredentials, RegisterData, User } from '@/types/auth';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    localStorage.setItem('token', response.token);
    return response;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);
    localStorage.setItem('token', response.token);
    return response;
  },

  async me(): Promise<{ user: User }> {
    return api.get<{ user: User }>('/auth/me');
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.post('/auth/change-password', { currentPassword, newPassword });
  },

  logout(): void {
    localStorage.removeItem('token');
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};

import { api } from './api';

interface Invitation {
  id: string;
  code: string;
  email?: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';
  createdAt: string;
  expiresAt: string;
  usedAt?: string | null;
  usedByEmail?: string | null;
}

interface VerifyInvitationResponse {
  valid: boolean;
  coach: {
    id: string;
    name: string;
    avatar?: string | null;
  };
  email?: string | null;
}

export const invitationService = {
  async createInvitation(email?: string, expiresInDays = 7): Promise<{ invitation: Invitation; inviteLink: string }> {
    return api.post<{ invitation: Invitation; inviteLink: string }>('/invitations', { email, expiresInDays });
  },

  async getMyInvitations(): Promise<{ invitations: Invitation[] }> {
    return api.get<{ invitations: Invitation[] }>('/invitations');
  },

  async verifyInvitation(code: string): Promise<VerifyInvitationResponse> {
    return api.get<VerifyInvitationResponse>(`/invitations/verify/${code}`);
  },

  async cancelInvitation(invitationId: string): Promise<void> {
    await api.delete(`/invitations/${invitationId}`);
  },
};

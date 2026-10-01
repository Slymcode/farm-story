import { api } from '@/api/client';

export interface AuthUser {
  id: string; name: string; email: string; role: 'FARMER'; onboardingCompleted: boolean;
  farmer: { id: string; farmerId: string; farmId: string | null } | null;
}

export const registerAccount = (json: { name: string; email: string; password: string }) => api<AuthUser>('/auth/register', { method: 'POST', json });
export const loginAccount = (json: { email: string; password: string }) => api<AuthUser>('/auth/login', { method: 'POST', json });
export const logoutAccount = () => api<void>('/auth/logout', { method: 'POST' });
export const fetchMe = () => api<AuthUser>('/auth/me');

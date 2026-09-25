import { httpClient } from '@/lib/httpClient';
import type {
  AuthResponse,
  CatalogItem,
  LoginRequest,
  MessageResponse,
  RegisterRequest,
  RegisterResponse,
} from '../types';

export function registerUser(data: RegisterRequest): Promise<RegisterResponse> {
  return httpClient.post<RegisterResponse>('/auth/register', data);
}

export function loginUser(data: LoginRequest): Promise<AuthResponse> {
  return httpClient.post<AuthResponse>('/auth/login', data);
}

export function verifyEmail(token: string): Promise<MessageResponse> {
  return httpClient.get<MessageResponse>(`/auth/verify-email?token=${encodeURIComponent(token)}`);
}

export function forgotPassword(email: string): Promise<MessageResponse> {
  return httpClient.post<MessageResponse>('/auth/forgot-password', { email });
}

export function resetPassword(token: string, newPassword: string): Promise<MessageResponse> {
  return httpClient.post<MessageResponse>('/auth/reset-password', { token, newPassword });
}

export function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<MessageResponse> {
  return httpClient.post<MessageResponse>(
    '/auth/change-password',
    { currentPassword, newPassword },
    { auth: true },
  );
}

export function confirmPasswordChange(token: string): Promise<MessageResponse> {
  return httpClient.get<MessageResponse>(
    `/auth/confirm-password-change?token=${encodeURIComponent(token)}`,
  );
}

export function fetchCarreras(): Promise<CatalogItem[]> {
  return httpClient.get<CatalogItem[]>('/catalogs/carreras');
}

export function fetchSemestres(): Promise<CatalogItem[]> {
  return httpClient.get<CatalogItem[]>('/catalogs/semestres');
}

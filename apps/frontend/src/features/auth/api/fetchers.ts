import { apiClient } from '@/api/client';
import type {
  LoginInput,
  LoginResponse,
  RegisterInput,
  RegisterResponse,
  RequestPasswordResetInput,
  RequestPasswordResetResponse,
  ConfirmPasswordResetInput,
  ConfirmPasswordResetResponse,
  ChangePasswordInput,
  ChangePasswordResponse,
  ChangeEmailInput,
  ChangeEmailResponse,
  NotificationPreferences,
  NotificationPreferencesUpdate,
} from '../types';

export const login = async (data: LoginInput): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/auth/login', data);
  // Token is stored in an HttpOnly cookie by the server (inaccessible to JS).
  // We only keep a lightweight flag to know if the user is logged in on the client.
  localStorage.setItem('auth', '1');
  return response.data;
};

export const register = async (data: RegisterInput): Promise<RegisterResponse> => {
  const response = await apiClient.post<RegisterResponse>('/auth/register', data);
  return response.data;
};

export const logout = async (): Promise<void> => {
  await apiClient.post('/auth/logout');
  localStorage.removeItem('auth');
};

export const getMe = async (): Promise<RegisterResponse> => {
  const response = await apiClient.get<RegisterResponse>('/auth/me');
  return response.data;
};

export const requestPasswordReset = async (data: RequestPasswordResetInput): Promise<RequestPasswordResetResponse> => {
  const response = await apiClient.post<RequestPasswordResetResponse>('/auth/password/reset', data);
  return response.data;
};

export const confirmPasswordReset = async (data: ConfirmPasswordResetInput): Promise<ConfirmPasswordResetResponse> => {
  const response = await apiClient.post<ConfirmPasswordResetResponse>('/auth/password/confirm', data);
  return response.data;
};

export const changePassword = async (data: ChangePasswordInput): Promise<ChangePasswordResponse> => {
  const response = await apiClient.patch<ChangePasswordResponse>('/auth/password/change', data);
  return response.data;
};

export const changeEmail = async (data: ChangeEmailInput): Promise<ChangeEmailResponse> => {
  const response = await apiClient.patch<ChangeEmailResponse>('/auth/email/change', data);
  return response.data;
};

export const getNotificationPreferences = async (): Promise<NotificationPreferences> => {
  const response = await apiClient.get<NotificationPreferences>('/auth/preferences');
  return response.data;
};

export const updateNotificationPreferences = async (data: NotificationPreferencesUpdate): Promise<NotificationPreferences> => {
  const response = await apiClient.patch<NotificationPreferences>('/auth/preferences', data);
  return response.data;
};

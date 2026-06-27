import { apiClient } from '@/lib/api-client';
import { LoginRequest, User } from '@/types';

export const authService = {
  async login(credentials: LoginRequest): Promise<{ accessToken: string; user: User }> {
    return apiClient.post<{ accessToken: string; user: User }>('/auth/login', credentials);
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  async isAuthenticated(): Promise<boolean> {
    try {
      await this.getProfile();
      return true;
    } catch {
      return false;
    }
  },

  getProfile(): Promise<User> {
    return apiClient.get<User>('/users/me');
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    return apiClient.post('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    return apiClient.post('/auth/reset-password', { token, password });
  },
};

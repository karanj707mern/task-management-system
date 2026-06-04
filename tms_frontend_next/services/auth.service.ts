'use client';

import { apiClient } from '@/lib/api-client';
import { AuthToken, LoginRequest, RegisterRequest, User } from '@/types';

/**
 * Authentication service
 */
export const authService = {
  async login(credentials: LoginRequest): Promise<{ token: AuthToken; user: User }> {
    const response = await apiClient.post('/auth/login', credentials);
    if (response.data?.token) {
      localStorage.setItem('auth_token', response.data.token.accessToken);
      if (response.data.token.refreshToken) {
        localStorage.setItem('refresh_token', response.data.token.refreshToken);
      }
    }
    return response.data;
  },

  async register(data: RegisterRequest): Promise<User> {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  async logout(): Promise<void> {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    await apiClient.post('/auth/logout', {});
  },

  async refreshToken(): Promise<AuthToken> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) throw new Error('No refresh token available');

    const response = await apiClient.post('/auth/refresh', { refreshToken });
    if (response.data?.accessToken) {
      localStorage.setItem('auth_token', response.data.accessToken);
    }
    return response.data;
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<void> {
    await apiClient.put('/auth/change-password', data);
  },

  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('auth_token');
  },

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  },
};

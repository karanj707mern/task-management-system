'use client';

import { apiClient } from '@/lib/api-client';
import { User, UserRole } from '@/types';
import { generateQueryString } from '@/lib/utils';

export interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  department?: string;
  isActive?: boolean;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  department?: string;
  jobTitle?: string;
  phone?: string;
  avatar?: string;
  password?: string;
  isActive?: boolean;
  role?: UserRole;
}

export const userService = {
  async getAll(filters?: UserFilters): Promise<{ data: User[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const queryString = generateQueryString(filters || {});
    return apiClient.get(`/users${queryString}`);
  },

  async getById(id: string): Promise<User> {
    return apiClient.get(`/users/${id}`);
  },

  async getProfile(): Promise<User> {
    return apiClient.get('/users/me');
  },

  async updateProfile(data: UpdateUserPayload): Promise<User> {
    return apiClient.patch('/users/me', data);
  },

  async update(id: string, data: UpdateUserPayload): Promise<User> {
    return apiClient.patch(`/users/${id}`, data);
  },

  async create(data: { email: string; password: string; name?: string; role?: UserRole }): Promise<User> {
    return apiClient.post('/users', data);
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  },

  async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append('avatar', file);
    return apiClient.upload('/users/me/avatar', formData);
  },
};

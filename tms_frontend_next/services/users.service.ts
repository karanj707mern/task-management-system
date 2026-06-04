'use client';

import { apiClient } from '@/lib/api-client';
import { User } from '@/types';
import { generateQueryString } from '@/lib/utils';

export interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
}

/**
 * Users API service
 */
export const userService = {
  async getAll(filters?: UserFilters) {
    const queryString = generateQueryString(filters || {});
    const response = await apiClient.get(`/users${queryString}`);
    return response.data;
  },

  async getById(id: string): Promise<User> {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  async getProfile(): Promise<User> {
    const response = await apiClient.get('/users/profile/me');
    return response.data;
  },

  async update(id: string, data: Partial<User>): Promise<User> {
    const response = await apiClient.put(`/users/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  },
};

'use client';

import { apiClient } from '@/lib/api-client';
import { Task, TaskStatus } from '@/types';
import { generateQueryString } from '@/lib/utils';

export interface TaskFilters {
  page?: number;
  limit?: number;
  projectId?: string;
  status?: TaskStatus;
  assigneeId?: string;
}

/**
 * Tasks API service
 */
export const taskService = {
  async getAll(filters?: TaskFilters) {
    const queryString = generateQueryString(filters || {});
    const response = await apiClient.get(`/tasks${queryString}`);
    return response.data;
  },

  async getById(id: string): Promise<Task> {
    const response = await apiClient.get(`/tasks/${id}`);
    return response.data;
  },

  async create(data: Partial<Task>): Promise<Task> {
    const response = await apiClient.post('/tasks', data);
    return response.data;
  },

  async update(id: string, data: Partial<Task>): Promise<Task> {
    const response = await apiClient.put(`/tasks/${id}`, data);
    return response.data;
  },

  async updateStatus(id: string, status: TaskStatus): Promise<Task> {
    const response = await apiClient.patch(`/tasks/${id}/status`, { status });
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/tasks/${id}`);
  },
};

'use client';

import { apiClient } from '@/lib/api-client';
import { Project } from '@/types';
import { generateQueryString } from '@/lib/utils';

export interface ProjectFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

/**
 * Projects API service
 */
export const projectService = {
  async getAll(filters?: ProjectFilters) {
    const queryString = generateQueryString(filters || {});
    const response = await apiClient.get(`/projects${queryString}`);
    return response.data;
  },

  async getById(id: string): Promise<Project> {
    const response = await apiClient.get(`/projects/${id}`);
    return response.data;
  },

  async create(data: Partial<Project>): Promise<Project> {
    const response = await apiClient.post('/projects', data);
    return response.data;
  },

  async update(id: string, data: Partial<Project>): Promise<Project> {
    const response = await apiClient.put(`/projects/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/projects/${id}`);
  },
};

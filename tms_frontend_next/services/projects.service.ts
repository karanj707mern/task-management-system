'use client';

import { apiClient } from '@/lib/api-client';
import { Project, ProjectStatus } from '@/types';
import { generateQueryString } from '@/lib/utils';

export interface ProjectFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: ProjectStatus;
}

export const projectService = {
  async getAll(filters?: ProjectFilters): Promise<{ data: Project[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const queryString = generateQueryString(filters || {});
    return apiClient.get(`/projects${queryString}`);
  },

  async getById(id: string): Promise<Project> {
    return apiClient.get<Project>(`/projects/${id}`);
  },

  async create(data: Partial<Project>): Promise<Project> {
    return apiClient.post<Project>('/projects', data);
  },

  async update(id: string, data: Partial<Project>): Promise<Project> {
    return apiClient.patch<Project>(`/projects/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete<void>(`/projects/${id}`);
  },
};

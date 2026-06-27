import { apiClient } from '@/lib/api-client';
import { Sprint, SprintStatus } from '@/types';
import { generateQueryString } from '@/lib/utils';

export interface SprintFilters {
  page?: number;
  limit?: number;
  projectId?: string;
  epicId?: string;
  status?: SprintStatus;
}

export interface CreateSprintPayload {
  name: string;
  goal?: string;
  projectId: string;
  epicId?: string;
  startDate?: string;
  endDate?: string;
  status?: SprintStatus;
}

export interface UpdateSprintPayload {
  name?: string;
  goal?: string;
  status?: SprintStatus;
  epicId?: string;
  startDate?: string;
  endDate?: string;
}

export const sprintService = {
  async getAll(filters?: SprintFilters): Promise<{ data: Sprint[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const queryString = generateQueryString(filters || {});
    return apiClient.get(`/sprints${queryString}`);
  },

  async getById(id: string): Promise<Sprint> {
    return apiClient.get(`/sprints/${id}`);
  },

  async create(data: CreateSprintPayload): Promise<Sprint> {
    return apiClient.post('/sprints', data);
  },

  async update(id: string, data: UpdateSprintPayload): Promise<Sprint> {
    return apiClient.patch(`/sprints/${id}`, data);
  },

  async updateStatus(id: string, status: SprintStatus): Promise<Sprint> {
    return apiClient.patch(`/sprints/${id}/status`, { status });
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/sprints/${id}`);
  },
};
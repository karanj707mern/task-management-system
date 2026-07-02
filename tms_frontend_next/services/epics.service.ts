import { apiClient } from '@/lib/api-client';
import { generateQueryString } from '@/lib/utils';
import { Epic } from '@/types';

export interface EpicFilters {
  page?: number;
  limit?: number;
  projectId?: string;
  status?: string;
}

export interface CreateEpicPayload {
  name: string;
  description?: string;
  projectId: string;
  color?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export const epicService = {
  async getAll(filters?: EpicFilters): Promise<{ data: Epic[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const queryString = generateQueryString(filters || {});
    return apiClient.get(`/epics${queryString}`);
  },

  async getById(id: string): Promise<Epic> {
    return apiClient.get(`/epics/${id}`);
  },

  async create(data: CreateEpicPayload): Promise<Epic> {
    return apiClient.post('/epics', data);
  },

  async update(id: string, data: Partial<Epic>): Promise<Epic> {
    return apiClient.patch(`/epics/${id}`, data);
  },

  async updateStatus(id: string, status: string): Promise<Epic> {
    return apiClient.patch(`/epics/${id}/status`, { status });
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/epics/${id}`);
  },
};

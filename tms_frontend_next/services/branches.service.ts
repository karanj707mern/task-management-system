import { apiClient } from '@/lib/api-client';
import { Branch } from '@/types';
import { generateQueryString } from '@/lib/utils';

export interface BranchFilters {
  page?: number;
  limit?: number;
  taskId?: string;
  sprintId?: string;
}

export interface CreateBranchPayload {
  name: string;
  taskId: string;
  sprintId?: string;
}

export const branchService = {
  async getAll(filters?: BranchFilters): Promise<{ data: Branch[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const queryString = generateQueryString(filters || {});
    return apiClient.get(`/branches${queryString}`);
  },

  async getById(id: string): Promise<Branch> {
    return apiClient.get(`/branches/${id}`);
  },

  async create(data: CreateBranchPayload): Promise<Branch> {
    return apiClient.post('/branches', data);
  },

  async update(id: string, data: Partial<Branch>): Promise<Branch> {
    return apiClient.patch(`/branches/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/branches/${id}`);
  },
};
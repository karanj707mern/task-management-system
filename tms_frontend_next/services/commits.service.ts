import { apiClient } from '@/lib/api-client';
import { Commit } from '@/types';
import { generateQueryString } from '@/lib/utils';

export interface CommitFilters {
  page?: number;
  limit?: number;
  branchId?: string;
  taskId?: string;
  prId?: string;
}

export interface CreateCommitPayload {
  message: string;
  branchId: string;
  taskId?: string;
  sha: string;
}

export const commitService = {
  async getAll(filters?: CommitFilters): Promise<{ data: Commit[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const queryString = generateQueryString(filters || {});
    return apiClient.get(`/commits${queryString}`);
  },

  async getById(id: string): Promise<Commit> {
    return apiClient.get(`/commits/${id}`);
  },

  async create(data: CreateCommitPayload): Promise<Commit> {
    return apiClient.post('/commits', data);
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/commits/${id}`);
  },
};
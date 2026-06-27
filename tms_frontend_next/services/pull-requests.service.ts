import { apiClient } from '@/lib/api-client';
import { PullRequest, PRStatus } from '@/types';
import { generateQueryString } from '@/lib/utils';

export interface PullRequestFilters {
  page?: number;
  limit?: number;
  taskId?: string;
  status?: PRStatus;
  authorId?: string;
  reviewerId?: string;
}

export interface CreatePullRequestPayload {
  title: string;
  description?: string;
  taskId: string;
  sourceBranch: string;
  targetBranch: string;
}

export interface UpdatePullRequestPayload {
  status?: PRStatus;
  reviewerId?: string;
  title?: string;
  description?: string;
}

export const pullRequestService = {
  async getAll(filters?: PullRequestFilters): Promise<{ data: PullRequest[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const queryString = generateQueryString(filters || {});
    return apiClient.get(`/pull-requests${queryString}`);
  },

  async getById(id: string): Promise<PullRequest> {
    return apiClient.get(`/pull-requests/${id}`);
  },

  async create(data: CreatePullRequestPayload): Promise<PullRequest> {
    return apiClient.post('/pull-requests', data);
  },

  async update(id: string, data: UpdatePullRequestPayload): Promise<PullRequest> {
    return apiClient.patch(`/pull-requests/${id}`, data);
  },

  async merge(id: string): Promise<PullRequest> {
    return apiClient.post(`/pull-requests/${id}/merge`);
  },

  async assignReviewer(id: string, reviewerId: string): Promise<PullRequest> {
    return apiClient.post(`/pull-requests/${id}/reviewer`, { reviewerId });
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/pull-requests/${id}`);
  },
};

export const assignReviewer = pullRequestService.assignReviewer;
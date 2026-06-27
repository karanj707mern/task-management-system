import { apiClient } from '@/lib/api-client';
import { CodeReview } from '@/types';
import { generateQueryString } from '@/lib/utils';

export interface CodeReviewFilters {
  page?: number;
  limit?: number;
  prId?: string;
  reviewerId?: string;
  status?: string;
}

export interface CreateCodeReviewPayload {
  prId: string;
  reviewerId: string;
  status?: string;
  comments?: string;
}

export interface UpdateCodeReviewPayload {
  status?: string;
  comments?: string;
}

export const codeReviewService = {
  async getAll(filters?: CodeReviewFilters): Promise<{ data: CodeReview[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const queryString = generateQueryString(filters || {});
    return apiClient.get(`/code-reviews${queryString}`);
  },

  async getById(id: string): Promise<CodeReview> {
    return apiClient.get(`/code-reviews/${id}`);
  },

  async create(data: CreateCodeReviewPayload): Promise<CodeReview> {
    return apiClient.post('/code-reviews', data);
  },

  async update(id: string, data: UpdateCodeReviewPayload): Promise<CodeReview> {
    return apiClient.patch(`/code-reviews/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/code-reviews/${id}`);
  },
};
import { apiClient } from '@/lib/api-client';
import { Comment } from '@/types';
import { generateQueryString } from '@/lib/utils';

export interface CreateCommentPayload {
  content: string;
  taskId: string;
}

export interface UpdateCommentPayload {
  content: string;
}

export const commentService = {
  async getByTaskId(taskId: string, page = 1, limit = 10): Promise<{ data: Comment[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const queryString = generateQueryString({ page, limit });
    return apiClient.get(`/comments/task/${taskId}${queryString}`);
  },

  async getById(id: string): Promise<Comment> {
    return apiClient.get<Comment>(`/comments/${id}`);
  },

  async create(data: CreateCommentPayload): Promise<Comment> {
    return apiClient.post<Comment>('/comments', data);
  },

  async update(id: string, data: UpdateCommentPayload): Promise<Comment> {
    return apiClient.patch<Comment>(`/comments/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete<void>(`/comments/${id}`);
  },
};

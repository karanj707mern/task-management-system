import { apiClient } from '@/lib/api-client';
import { Task, TaskStatus, TaskPriority } from '@/types';
import { generateQueryString } from '@/lib/utils';

export interface TaskFilters {
  page?: number;
  limit?: number;
  projectId?: string;
  status?: TaskStatus;
  assigneeId?: string;
  priority?: TaskPriority;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  projectId: string;
  assigneeId: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  estimatedHours?: number;
  parentTaskId?: string;
  tags?: string[];
}

export const taskService = {
  async getAll(filters?: TaskFilters): Promise<{ data: Task[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const queryString = generateQueryString(filters || {});
    return apiClient.get(`/tasks${queryString}`);
  },

  async getById(id: string): Promise<Task> {
    return apiClient.get<Task>(`/tasks/${id}`);
  },

  async create(data: CreateTaskPayload): Promise<Task> {
    return apiClient.post<Task>('/tasks', data);
  },

  async update(id: string, data: Partial<Task>): Promise<Task> {
    return apiClient.patch<Task>(`/tasks/${id}`, data);
  },

  async updateStatus(id: string, status: TaskStatus): Promise<Task> {
    return apiClient.patch<Task>(`/tasks/${id}/status`, { status });
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete<void>(`/tasks/${id}`);
  },

  async createWorkLog(taskId: string, hours: number, description?: string) {
    return apiClient.post(`/tasks/${taskId}/worklogs`, { hours, description });
  },
};

export const getTasks = taskService.getAll;

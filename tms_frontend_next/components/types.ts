import type { TaskStatus } from '@/types';

export interface TaskFilters {
  status?: TaskStatus;
  projectId?: string;
  assigneeId?: string;
  page?: number;
  limit?: number;
}
import { apiClient } from '@/lib/api-client';

export const dashboardService = {
  async getStats(): Promise<{
    totalTasks: number;
    tasksByStatus: Record<string, number>;
    overdueCount: number;
    completedThisWeek: number;
    totalHoursLogged: number;
  }> {
    return apiClient.get('/dashboard/stats');
  },
};

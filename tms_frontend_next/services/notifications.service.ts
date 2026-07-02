import { apiClient } from '@/lib/api-client';
import { generateQueryString } from '@/lib/utils';
import { Notification } from '@/types';

export interface NotificationFilters {
  page?: number;
  limit?: number;
}

export const notificationService = {
  async getAll(filters?: NotificationFilters): Promise<{ data: Notification[]; meta: { total: number; unread: number; page: number; limit: number; totalPages: number } }> {
    const queryString = generateQueryString(filters || {});
    return apiClient.get(`/notifications${queryString}`);
  },

  async getUnreadCount(): Promise<{ unread: number }> {
    return apiClient.get('/notifications/unread/count');
  },

  async getById(id: string): Promise<Notification> {
    return apiClient.get<Notification>(`/notifications/${id}`);
  },

  async markAsRead(id: string): Promise<Notification> {
    return apiClient.patch<Notification>(`/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<{ data: Notification[]; meta: { total: number; unread: number; page: number; limit: number; totalPages: number } }> {
    return apiClient.patch('/notifications/read-all');
  },

  async deleteNotification(id: string): Promise<void> {
    await apiClient.delete<void>(`/notifications/${id}`);
  },

  async deleteAllNotifications(): Promise<void> {
    await apiClient.delete<void>('/notifications');
  },
};

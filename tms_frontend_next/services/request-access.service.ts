'use client';

import { apiClient } from '@/lib/api-client';
import { generateQueryString } from '@/lib/utils';

export interface RequestAccessPayload {
  name: string;
  email: string;
  department: string;
  jobTitle: string;
  reason?: string;
}

export interface ReviewRequestAccessPayload {
  status: 'APPROVED' | 'REJECTED';
}

export const requestAccessService = {
  async submit(data: RequestAccessPayload) {
    return apiClient.post('/request-access', data);
  },

  async getAll(filters?: { status?: string; search?: string; page?: number; limit?: number }) {
    const queryString = generateQueryString(filters || {});
    return apiClient.get(`/request-access${queryString}`);
  },

  async findPending() {
    return apiClient.get('/request-access/pending');
  },

  async getById(id: string) {
    return apiClient.get(`/request-access/${id}`);
  },

  async approve(id: string) {
    return apiClient.patch(`/request-access/${id}/approve`);
  },

  async reject(id: string) {
    return apiClient.patch(`/request-access/${id}/reject`);
  },
};

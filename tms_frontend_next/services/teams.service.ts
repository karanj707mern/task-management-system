import { apiClient } from '@/lib/api-client';
import { Team, TeamMember, TeamMemberRole } from '@/types';
import { generateQueryString } from '@/lib/utils';

export interface TeamFilters {
  page?: number;
  limit?: number;
}

export interface CreateTeamPayload {
  name: string;
  description?: string;
}

export interface UpdateTeamPayload {
  name?: string;
  description?: string;
}

export const teamService = {
  async getAll(filters?: TeamFilters): Promise<{ data: Team[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const queryString = generateQueryString(filters || {});
    return apiClient.get(`/teams${queryString}`);
  },

  async getById(id: string): Promise<Team> {
    return apiClient.get<Team>(`/teams/${id}`);
  },

  async create(data: CreateTeamPayload): Promise<Team> {
    return apiClient.post<Team>('/teams', data);
  },

  async update(id: string, data: UpdateTeamPayload): Promise<Team> {
    return apiClient.patch<Team>(`/teams/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete<void>(`/teams/${id}`);
  },

  async addMember(teamId: string, userId: string, role: TeamMemberRole = TeamMemberRole.MEMBER): Promise<TeamMember> {
    return apiClient.post<TeamMember>(`/teams/${teamId}/members/${userId}`, { role });
  },

  async removeMember(teamId: string, userId: string): Promise<void> {
    await apiClient.delete<void>(`/teams/${teamId}/members/${userId}`);
  },

  async updateMemberRole(teamId: string, userId: string, role: TeamMemberRole): Promise<void> {
    return apiClient.patch<void>(`/teams/${teamId}/members/${userId}`, { role });
  },

  async getMembers(teamId: string, page = 1, limit = 10): Promise<{ data: TeamMember[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const queryString = generateQueryString({ page, limit });
    return apiClient.get(`/teams/${teamId}/members${queryString}`);
  },
};

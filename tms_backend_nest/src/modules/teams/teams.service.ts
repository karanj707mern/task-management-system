import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { TeamRepository } from './teams.repository';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { IPaginationQuery } from '@/common/types/common.types';

@Injectable()
export class TeamsService {
  constructor(private readonly teamRepository: TeamRepository) {}

  async createTeam(createTeamDto: CreateTeamDto) {
    try {
      return await this.teamRepository.create(createTeamDto);
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Team with this name already exists');
      }
      throw error;
    }
  }

  async getTeam(id: string) {
    const team = await this.teamRepository.findById(id);
    if (!team) {
      throw new NotFoundException('Team not found');
    }
    return team;
  }

  async getAllTeams(query: IPaginationQuery) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [teams, total] = await Promise.all([
      this.teamRepository.findAll(skip, limit),
      this.teamRepository.count(),
    ]);

    return {
      data: teams,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateTeam(id: string, updateTeamDto: UpdateTeamDto) {
    await this.getTeam(id);
    try {
      return await this.teamRepository.update(id, updateTeamDto);
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Team with this name already exists');
      }
      throw error;
    }
  }

  async deleteTeam(id: string) {
    await this.getTeam(id);
    await this.teamRepository.delete(id);
    return { message: 'Team deleted successfully' };
  }

  async addMemberToTeam(teamId: string, userId: string) {
    await this.getTeam(teamId);

    const existingMember = await this.teamRepository.findMember(teamId, userId);
    if (existingMember) {
      throw new ConflictException('User is already a member of this team');
    }

    return this.teamRepository.addMember(teamId, userId);
  }

  async removeMemberFromTeam(teamId: string, userId: string) {
    await this.getTeam(teamId);

    const member = await this.teamRepository.findMember(teamId, userId);
    if (!member) {
      throw new NotFoundException('Member not found in this team');
    }

    await this.teamRepository.removeMember(teamId, userId);
    return { message: 'Member removed successfully' };
  }

  async getTeamMembers(teamId: string, query: IPaginationQuery) {
    await this.getTeam(teamId);

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [members, total] = await Promise.all([
      this.teamRepository.getTeamMembers(teamId, skip, limit),
      this.teamRepository.countTeamMembers(teamId),
    ]);

    return {
      data: members,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

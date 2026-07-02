import { IPaginatedResponse } from '@/common/types/common.types';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { TeamsQueryDto } from '@/common/dto/pagination-query.dto';
import { TeamRepository } from './teams.repository';
import { TeamMemberRole, UserRole } from '@prisma/client';
import { assertRole, isManagerOrAbove } from '@/common/authorization/authorization';
import { Permission, PermissionService } from '@/shared/permissions/permission.service';

@Injectable()
export class TeamsService {
  constructor(
    private readonly teamRepository: TeamRepository,
    private readonly permissionService: PermissionService,
  ) {}

  async createTeam(createTeamDto: CreateTeamDto, role: UserRole) {
    this.permissionService.checkPermission(role, Permission.MANAGE_TEAM);
    assertRole(role, ['SUPER_ADMIN', 'ADMIN', 'MANAGER']);
    try {
      return await this.teamRepository.create(createTeamDto);
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Team with this name already exists');
        }
      }
      throw error;
    }
  }

  async getTeam(id: string, role: UserRole) {
    this.permissionService.checkPermission(role, Permission.READ_TEAM);
    assertRole(role, ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER']);
    const team = await this.teamRepository.findById(id);
    if (!team) {
      throw new NotFoundException('Team not found');
    }
    return team;
  }

  async getAllTeams(query: TeamsQueryDto): Promise<IPaginatedResponse<unknown>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
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

  async updateTeam(id: string, updateTeamDto: UpdateTeamDto, role: UserRole) {
    this.permissionService.checkPermission(role, Permission.MANAGE_TEAM);
    if (!isManagerOrAbove(role)) {
      throw new ForbiddenException('Only managers and administrators can update teams');
    }
    await this.getTeam(id, role);
    try {
      return await this.teamRepository.update(id, updateTeamDto);
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Team with this name already exists');
        }
      }
      throw error;
    }
  }

  async deleteTeam(id: string, role: UserRole) {
    this.permissionService.checkPermission(role, Permission.MANAGE_TEAM);
    if (!isManagerOrAbove(role)) {
      throw new ForbiddenException('Only managers and administrators can delete teams');
    }
    await this.getTeam(id, role);
    await this.teamRepository.delete(id);
    return { message: 'Team deleted successfully' };
  }

  async addMemberToTeam(teamId: string, userId: string, role: UserRole, memberRole: TeamMemberRole = TeamMemberRole.MEMBER) {
    this.permissionService.checkPermission(role, Permission.MANAGE_TEAM);
    if (!isManagerOrAbove(role)) {
      throw new ForbiddenException('Only managers and administrators can manage team members');
    }
    await this.getTeam(teamId, role);

    const existingMember = await this.teamRepository.findMember(teamId, userId);
    if (existingMember) {
      throw new ConflictException('User is already a member of this team');
    }

    return this.teamRepository.addMember(teamId, userId, memberRole);
  }

  async updateMemberRole(teamId: string, userId: string, role: UserRole, memberRole: TeamMemberRole) {
    this.permissionService.checkPermission(role, Permission.MANAGE_TEAM);
    if (!isManagerOrAbove(role)) {
      throw new ForbiddenException('Only managers and administrators can manage team members');
    }
    await this.getTeam(teamId, role);

    const member = await this.teamRepository.findMember(teamId, userId);
    if (!member) {
      throw new NotFoundException('Member not found in this team');
    }

    return this.teamRepository.updateMemberRole(teamId, userId, memberRole);
  }

  async removeMemberFromTeam(teamId: string, userId: string, role: UserRole) {
    this.permissionService.checkPermission(role, Permission.MANAGE_TEAM);
    if (!isManagerOrAbove(role)) {
      throw new ForbiddenException('Only managers and administrators can manage team members');
    }
    await this.getTeam(teamId, role);

    const member = await this.teamRepository.findMember(teamId, userId);
    if (!member) {
      throw new NotFoundException('Member not found in this team');
    }

    await this.teamRepository.removeMember(teamId, userId);
    return { message: 'Member removed successfully' };
  }

  async getTeamMembers(teamId: string, query: TeamsQueryDto, role: UserRole) {
    await this.getTeam(teamId, role);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
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
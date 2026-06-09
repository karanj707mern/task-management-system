import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';

@Injectable()
export class TeamRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateTeamDto) {
    return this.prisma.team.create({
      data,
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.team.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  async findAll(skip: number, take: number) {
    return this.prisma.team.findMany({
      skip,
      take,
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async count() {
    return this.prisma.team.count();
  }

  async update(id: string, data: UpdateTeamDto) {
    return this.prisma.team.update({
      where: { id },
      data,
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  async delete(id: string) {
    return this.prisma.team.delete({
      where: { id },
    });
  }

  async addMember(teamId: string, userId: string, role: string = 'MEMBER') {
    return this.prisma.teamMember.create({
      data: {
        teamId,
        userId,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }

  async removeMember(teamId: string, userId: string) {
    return this.prisma.teamMember.deleteMany({
      where: {
        teamId,
        userId,
      },
    });
  }

  async findMember(teamId: string, userId: string) {
    return this.prisma.teamMember.findFirst({
      where: {
        teamId,
        userId,
      },
    });
  }

  async getTeamMembers(teamId: string, skip: number, take: number) {
    return this.prisma.teamMember.findMany({
      where: { teamId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      skip,
      take,
    });
  }

  async countTeamMembers(teamId: string) {
    return this.prisma.teamMember.count({
      where: { teamId },
    });
  }
}

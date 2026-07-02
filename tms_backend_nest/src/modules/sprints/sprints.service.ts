import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { SprintStatus, TaskStatus } from '@prisma/client';
import { CreateSprintDto } from './dto/create-sprint.dto';
import { UpdateSprintDto } from './dto/update-sprint.dto';
import { UserRole } from '@prisma/client';
import { assertRole, isManagerOrAbove } from '@/common/authorization/authorization';
import { SprintsQueryDto } from '@/common/dto/pagination-query.dto';

@Injectable()
export class SprintsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSprintDto, userId: string, role: UserRole) {
    assertRole(role, ['SUPER_ADMIN', 'ADMIN', 'MANAGER']);

    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (dto.epicId) {
      const epic = await this.prisma.epic.findUnique({
        where: { id: dto.epicId },
      });

      if (!epic) {
        throw new NotFoundException('Epic not found');
      }
    }

    const sprint = await this.prisma.sprint.create({
      data: {
        name: dto.name,
        goal: dto.goal,
        projectId: dto.projectId,
        epicId: dto.epicId,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        createdById: userId,
        ...(dto.status ? { status: dto.status } : {}),
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        epic: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return sprint;
  }

  async findAll(role: UserRole, query: SprintsQueryDto) {
    assertRole(role, ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER']);

    const where: Record<string, unknown> = {};

    if (query.projectId) {
      where.projectId = query.projectId;
    }

    if (query.epicId) {
      where.epicId = query.epicId;
    }

    if (query.status) {
      where.status = query.status;
    }

    const take = query.limit ?? 10;
    const page = query.page ?? 1;
    const skip = (page - 1) * take;

    const [sprints, total] = await Promise.all([
      this.prisma.sprint.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
          epic: {
            select: {
              id: true,
              name: true,
            },
          },
          tasks: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
          _count: {
            select: {
              tasks: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take,
      }),
      this.prisma.sprint.count({ where }),
    ]);

    return {
      data: sprints,
      meta: {
        total,
        page,
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  async findOne(id: string, role: UserRole) {
    assertRole(role, ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER']);

    const sprint = await this.prisma.sprint.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        epic: {
          select: {
            id: true,
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        branches: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!sprint) {
      throw new NotFoundException('Sprint not found');
    }

    return sprint;
  }

  async update(id: string, dto: UpdateSprintDto, role: UserRole) {
    if (!isManagerOrAbove(role)) {
      throw new ForbiddenException('Only managers and administrators can update sprints');
    }

    await this.findOne(id, role);

    const updateData: Record<string, unknown> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.goal !== undefined) updateData.goal = dto.goal;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.epicId !== undefined) updateData.epicId = dto.epicId;
    if (dto.startDate !== undefined) updateData.startDate = dto.startDate ? new Date(dto.startDate) : null;
    if (dto.endDate !== undefined) updateData.endDate = dto.endDate ? new Date(dto.endDate) : null;

    return this.prisma.sprint.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        epic: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async updateStatus(id: string, status: SprintStatus, role: UserRole) {
    assertRole(role, ['SUPER_ADMIN', 'ADMIN', 'MANAGER']);

    await this.findOne(id, role);

    return this.prisma.sprint.update({
      where: { id },
      data: { status },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        epic: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async remove(id: string, role: UserRole) {
    if (!isManagerOrAbove(role)) {
      throw new ForbiddenException('Only managers and administrators can delete sprints');
    }

    await this.findOne(id, role);

    await this.prisma.sprint.delete({
      where: { id },
    });

    return {
      message: 'Sprint deleted successfully',
    };
  }

  async closeSprint(id: string, role: UserRole) {
    if (!isManagerOrAbove(role)) {
      throw new ForbiddenException('Only managers and administrators can close sprints');
    }

    const sprint = await this.prisma.sprint.findUnique({
      where: { id },
      include: { tasks: true },
    });

    if (!sprint) {
      throw new NotFoundException('Sprint not found');
    }

    const doneTasks = sprint.tasks.filter((t) => t.status === TaskStatus.DONE).length;
    const totalTasks = sprint.tasks.length;

    await this.prisma.sprint.update({
      where: { id },
      data: {
        status: SprintStatus.COMPLETED,
        endDate: new Date(),
      },
    });

    return {
      message: 'Sprint closed successfully',
      completed: true,
      stats: {
        totalTasks,
        doneTasks,
        remainingTasks: totalTasks - doneTasks,
        completionPercentage: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
      },
    };
  }

  async getSprintProgress(id: string, role: UserRole) {
    assertRole(role, ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER']);

    const sprint = await this.prisma.sprint.findUnique({
      where: { id },
      include: {
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            storyPoints: true,
            assignee: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!sprint) {
      throw new NotFoundException('Sprint not found');
    }

    const statusCounts: Record<string, number> = {};
    let totalStoryPoints = 0;
    let completedStoryPoints = 0;

    for (const task of sprint.tasks) {
      statusCounts[task.status] = (statusCounts[task.status] || 0) + 1;
      const sp = task.storyPoints || 0;
      totalStoryPoints += sp;
      if (task.status === TaskStatus.DONE) {
        completedStoryPoints += sp;
      }
    }

    return {
      sprintId: sprint.id,
      sprintName: sprint.name,
      status: sprint.status,
      totalTasks: sprint.tasks.length,
      statusCounts,
      totalStoryPoints,
      completedStoryPoints,
      completionPercentage: totalStoryPoints > 0 ? Math.round((completedStoryPoints / totalStoryPoints) * 100) : 0,
    };
  }
}
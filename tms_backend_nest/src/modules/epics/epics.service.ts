import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { EpicStatus } from '@prisma/client';
import { CreateEpicDto } from './dto/create-epic.dto';
import { UpdateEpicDto } from './dto/update-epic.dto';
import { UserRole } from '@prisma/client';
import { assertRole, isManagerOrAbove } from '@/common/authorization/authorization';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';

@Injectable()
export class EpicsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEpicDto, userId: string, role: UserRole) {
    if (!isManagerOrAbove(role)) {
      throw new ForbiddenException('Only managers and administrators can create epics');
    }

    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const epic = await this.prisma.epic.create({
      data: {
        name: dto.name,
        description: dto.description,
        color: dto.color,
        projectId: dto.projectId,
        createdById: userId,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        ...(dto.status ? { status: dto.status } : {}),
      },
      include: {
        project: {
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
      },
    });

    await this.prisma.activity.create({
      data: {
        userId,
        entityType: 'epic',
        entityId: epic.id,
        action: 'created',
        metadata: { name: epic.name },
      },
    });

    return epic;
  }

  async findAll(userId: string, role: UserRole, query?: PaginationQueryDto) {
    assertRole(role, ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER']);

    const take = query?.limit ?? 10;
    const page = query?.page ?? 1;
    const skip = (page - 1) * take;

    const where = isManagerOrAbove(role)
      ? undefined
      : {
          OR: [
            { createdById: userId },
            { tasks: { some: { assigneeId: userId } } },
          ],
        };

    const [epics, total] = await Promise.all([
      this.prisma.epic.findMany({
        where,
        include: {
          project: {
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
          _count: {
            select: {
              tasks: true,
              sprints: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take,
      }),
      this.prisma.epic.count({ where }),
    ]);

    return {
      data: epics,
      meta: {
        total,
        page,
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  async findOne(id: string, userId: string, role: UserRole) {
    assertRole(role, ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER']);

    const where = isManagerOrAbove(role)
      ? { id }
      : {
          id,
          OR: [
            { createdById: userId },
            { tasks: { some: { assigneeId: userId } } },
          ],
        };

    const epic = await this.prisma.epic.findFirst({
      where,
      include: {
        project: {
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
            priority: true,
            assigneeId: true,
          },
        },
        sprints: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    if (!epic) {
      throw new NotFoundException('Epic not found');
    }

    return epic;
  }

  async update(id: string, dto: UpdateEpicDto, userId: string, role: UserRole) {
    if (!isManagerOrAbove(role)) {
      throw new ForbiddenException('Only managers and administrators can update epics');
    }

    const epic = await this.prisma.epic.findUnique({
      where: { id },
    });

    if (!epic) {
      throw new NotFoundException('Epic not found');
    }

    const updated = await this.prisma.epic.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.color !== undefined ? { color: dto.color } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.startDate !== undefined
          ? { startDate: dto.startDate ? new Date(dto.startDate) : null }
          : {}),
        ...(dto.endDate !== undefined
          ? { endDate: dto.endDate ? new Date(dto.endDate) : null }
          : {}),
      },
      include: {
        project: {
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
      },
    });

    await this.prisma.activity.create({
      data: {
        userId,
        entityType: 'epic',
        entityId: id,
        action: 'updated',
        metadata: { name: updated.name },
      },
    });

    return updated;
  }

  async updateStatus(id: string, status: EpicStatus, userId: string, role: UserRole) {
    if (!isManagerOrAbove(role)) {
      throw new ForbiddenException('Only managers and administrators can update epic status');
    }

    const epic = await this.prisma.epic.findUnique({
      where: { id },
    });

    if (!epic) {
      throw new NotFoundException('Epic not found');
    }

    return this.prisma.epic.update({
      where: { id },
      data: { status },
      include: {
        project: {
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
      },
    });
  }

  async remove(id: string, userId: string, role: UserRole) {
    if (!isManagerOrAbove(role)) {
      throw new ForbiddenException('Only managers and administrators can delete epics');
    }

    const epic = await this.prisma.epic.findUnique({
      where: { id },
    });

    if (!epic) {
      throw new NotFoundException('Epic not found');
    }

    await this.prisma.epic.delete({
      where: { id },
    });

    return {
      message: 'Epic deleted successfully',
    };
  }

  async getEpicProgress(id: string, userId: string, role: UserRole) {
    assertRole(role, ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER']);

    const epic = await this.prisma.epic.findUnique({
      where: { id },
      include: {
        tasks: true,
      },
    });

    if (!epic) {
      throw new NotFoundException('Epic not found');
    }

    const tasks = epic.tasks;

    const totalTasks = tasks.length;
    const tasksByStatus: Record<string, number> = {};
    let completedTasks = 0;
    let totalStoryPoints = 0;
    let completedStoryPoints = 0;

    for (const task of tasks) {
      tasksByStatus[task.status] = (tasksByStatus[task.status] || 0) + 1;
      if (task.status === 'DONE') {
        completedTasks++;
        completedStoryPoints += task.storyPoints || 0;
      }
      totalStoryPoints += task.storyPoints || 0;
    }

    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalTasks,
      tasksByStatus,
      completedTasks,
      completionPercentage,
      totalStoryPoints,
      completedStoryPoints,
      remainingStoryPoints: totalStoryPoints - completedStoryPoints,
    };
  }
}

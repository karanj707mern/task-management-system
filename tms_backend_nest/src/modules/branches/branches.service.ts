import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { ActivityService } from '@/modules/activity/activity.service';
import { UserRole } from '@prisma/client';
import { assertRole, isManagerOrAbove } from '@/common/authorization/authorization';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { BranchesQueryDto } from '@/common/dto/pagination-query.dto';

@Injectable()
export class BranchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityService: ActivityService,
  ) {}

  async create(dto: CreateBranchDto, userId: string, role: UserRole) {
    assertRole(role, ['SUPER_ADMIN', 'ADMIN', 'MANAGER']);

    const task = await this.prisma.task.findUnique({
      where: { id: dto.taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (dto.sprintId) {
      const sprint = await this.prisma.sprint.findUnique({
        where: { id: dto.sprintId },
      });

      if (!sprint) {
        throw new NotFoundException('Sprint not found');
      }
    }

    const branch = await this.prisma.branch.create({
      data: {
        name: dto.name,
        taskId: dto.taskId,
        sprintId: dto.sprintId,
        authorId: userId,
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
          },
        },
        sprint: {
          select: {
            id: true,
            name: true,
          },
        },
        author: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });

    await this.activityService.logBranchCreated(userId, branch.id, branch.name, dto.taskId);

    return branch;
  }

  async findAll(userId: string, role: UserRole, query: BranchesQueryDto) {
    assertRole(role, [
      'SUPER_ADMIN',
      'ADMIN',
      'MANAGER',
      'EMPLOYEE',
      'VIEWER',
    ]);

    const where: any = {};

    if (query.taskId) {
      where.taskId = query.taskId;
    }

    if (query.sprintId) {
      where.sprintId = query.sprintId;
    }

    if (!isManagerOrAbove(role)) {
      where.authorId = userId;
    }

    const take = query.limit ?? 10;
    const page = query.page ?? 1;
    const skip = (page - 1) * take;

    const [branches, total] = await Promise.all([
      this.prisma.branch.findMany({
        where,
        include: {
          task: {
            select: {
              id: true,
              title: true,
            },
          },
          sprint: {
            select: {
              id: true,
              name: true,
            },
          },
          author: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take,
      }),
      this.prisma.branch.count({ where }),
    ]);

    return {
      data: branches,
      meta: {
        total,
        page,
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  async findOne(id: string, userId: string, role: UserRole) {
    assertRole(role, [
      'SUPER_ADMIN',
      'ADMIN',
      'MANAGER',
      'EMPLOYEE',
      'VIEWER',
    ]);

    const branch = await this.prisma.branch.findUnique({
      where: { id },
      include: {
        task: {
          select: {
            id: true,
            title: true,
          },
        },
        sprint: {
          select: {
            id: true,
            name: true,
          },
        },
        author: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    const canView = await this.hasUpdatePermission(branch, userId, role);
    if (!canView) {
      throw new ForbiddenException('You do not have permission to view this branch');
    }

    return branch;
  }

  async findByTask(taskId: string, query: { page?: number; limit?: number }, userId: string, role: UserRole) {
    assertRole(role, ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER']);

    const where: Record<string, unknown> = { taskId };
    if (!isManagerOrAbove(role)) {
      where.authorId = userId;
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [branches, total] = await Promise.all([
      this.prisma.branch.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
            },
          },
          sprint: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.branch.count({ where }),
    ]);

    return {
      data: branches,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async hasUpdatePermission(
    branch: any,
    userId: string,
    role: UserRole,
  ): Promise<boolean> {
    if (isManagerOrAbove(role)) {
      return true;
    }

    if (branch.authorId === userId) {
      return true;
    }

    const task = await this.prisma.task.findUnique({
      where: { id: branch.taskId },
      select: {
        assigneeId: true,
        projectId: true,
      },
    });

    if (!task) {
      return false;
    }

    if (task.assigneeId === userId) {
      return true;
    }

    if (branch.sprintId) {
      const sprint = await this.prisma.sprint.findUnique({
        where: { id: branch.sprintId },
        select: {
          createdById: true,
        },
      });

      if (sprint && sprint.createdById === userId) {
        return true;
      }
    }

    return false;
  }

  async update(id: string, dto: UpdateBranchDto, userId: string, role: UserRole) {
    const branch = await this.findOne(id, userId, role);

    const canUpdate = await this.hasUpdatePermission(branch, userId, role);

    if (!canUpdate) {
      throw new ForbiddenException(
        'You do not have permission to update this branch',
      );
    }

    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.sprintId !== undefined) updateData.sprintId = dto.sprintId;

    const updated = await this.prisma.branch.update({
      where: { id },
      data: updateData,
      include: {
        task: {
          select: {
            id: true,
            title: true,
          },
        },
        sprint: {
          select: {
            id: true,
            name: true,
          },
        },
        author: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return updated;
  }

  async remove(id: string, userId: string, role: UserRole) {
    const branch = await this.findOne(id, userId, role);

    const canUpdate = await this.hasUpdatePermission(branch, userId, role);

    if (!canUpdate) {
      throw new ForbiddenException(
        'You do not have permission to delete this branch',
      );
    }

    await this.prisma.branch.delete({
      where: { id },
    });

    return {
      message: 'Branch deleted successfully',
    };
  }
}

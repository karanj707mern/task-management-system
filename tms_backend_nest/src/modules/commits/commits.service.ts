import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { ActivityService } from '@/modules/activity/activity.service';
import { UserRole } from '@prisma/client';
import { assertRole, isManagerOrAbove } from '@/common/authorization/authorization';
import { CreateCommitDto } from './dto/create-commit.dto';
import { IPaginationQuery } from '@/common/types/common.types';

@Injectable()
export class CommitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityService: ActivityService,
  ) {}

  async create(dto: CreateCommitDto, userId: string, role: UserRole) {
    const branch = await this.prisma.branch.findUnique({
      where: { id: dto.branchId },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    if (branch.authorId !== userId && !isManagerOrAbove(role)) {
      throw new ForbiddenException('Only branch author or managers and above can create commits');
    }

    if (dto.taskId) {
      const task = await this.prisma.task.findUnique({
        where: { id: dto.taskId },
      });

      if (!task) {
        throw new NotFoundException('Task not found');
      }
    }

    if (dto.prId) {
      const pullRequest = await this.prisma.pullRequest.findUnique({
        where: { id: dto.prId },
      });

      if (!pullRequest) {
        throw new NotFoundException('Pull request not found');
      }
    }

    try {
      const commit = await this.prisma.commit.create({
        data: {
          message: dto.message,
          branchId: dto.branchId,
          authorId: dto.authorId,
          taskId: dto.taskId,
          prId: dto.prId,
          sha: dto.sha,
        },
        include: {
          author: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
            },
          },
          task: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      await this.activityService.logCommitCreated(
        dto.authorId,
        commit.id,
        commit.branch?.name || 'unknown',
        dto.taskId,
      );

      return commit;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ForbiddenException('A commit with this SHA already exists');
      }
      throw error;
    }
  }

  async findAll(
    userId: string,
    role: UserRole,
    query: { branchId?: string; taskId?: string; prId?: string; authorId?: string; page?: number; limit?: number },
  ) {
    assertRole(role, ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER']);

    const where: Record<string, unknown> = {};

    if (!isManagerOrAbove(role)) {
      where.authorId = userId;
    }
    if (query.branchId) where.branchId = query.branchId;
    if (query.taskId) where.taskId = query.taskId;
    if (query.prId) where.prId = query.prId;
    if (query.authorId && isManagerOrAbove(role)) where.authorId = query.authorId;

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const [commits, total] = await Promise.all([
      this.prisma.commit.findMany({
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
          branch: {
            select: {
              id: true,
              name: true,
            },
          },
          task: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.commit.count({ where }),
    ]);

    return {
      data: commits,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
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
            { authorId: userId },
            { branch: { authorId: userId } },
          ],
        };

    const commit = await this.prisma.commit.findFirst({
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
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!commit) {
      throw new NotFoundException('Commit not found');
    }

    return commit;
  }

  async findByTask(taskId: string, query: IPaginationQuery, userId: string, role: UserRole) {
    assertRole(role, ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER']);

    const where: Record<string, unknown> = { taskId };
    if (!isManagerOrAbove(role)) {
      where.authorId = userId;
    }
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [commits, total] = await Promise.all([
      this.prisma.commit.findMany({
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
          branch: {
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
      this.prisma.commit.count({ where: { taskId } }),
    ]);

    return {
      data: commits,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async remove(id: string, userId: string, role: UserRole) {
    assertRole(role, ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER']);

    const commit = await this.prisma.commit.findUnique({
      where: { id },
    });

    if (!commit) {
      throw new NotFoundException('Commit not found');
    }

    if (!isManagerOrAbove(role) && commit.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own commits');
    }

    await this.prisma.commit.delete({
      where: { id },
    });

    return { message: 'Commit deleted successfully' };
  }
}

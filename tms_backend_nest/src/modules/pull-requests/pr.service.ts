import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { ActivityService } from '@/modules/activity/activity.service';
import { PRStatus, UserRole, ReviewStatus } from '@prisma/client';
import { CreatePrDto } from './dto/create-pr.dto';
import { UpdatePrDto } from './dto/update-pr.dto';
import { MergePrDto } from './dto/merge-pr.dto';
import { AddReviewerDto } from './dto/add-reviewer.dto';
import { assertRole, isManagerOrAbove } from '@/common/authorization/authorization';

@Injectable()
export class PrService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityService: ActivityService,
  ) {}

  async create(dto: CreatePrDto, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: dto.taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const pr = await this.prisma.pullRequest.create({
      data: {
        title: dto.title,
        description: dto.description,
        taskId: dto.taskId,
        sourceBranch: dto.sourceBranch,
        targetBranch: dto.targetBranch,
        status: dto.status ?? PRStatus.OPEN,
        authorId: userId,
        reviewerId: dto.reviewerId,
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
          },
        },
        author: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    await this.activityService.logPRCreated(
      userId,
      pr.id,
      dto.sourceBranch,
      dto.targetBranch,
      dto.taskId,
    );

    return pr;
  }

  async findAll(query: { taskId?: string; status?: PRStatus; authorId?: string; reviewerId?: string; page?: number; limit?: number }, userId: string, role: UserRole) {
    assertRole(role, ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER']);

    const where: Record<string, unknown> = {};

    if (query.taskId) {
      where.taskId = query.taskId;
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.authorId && isManagerOrAbove(role)) {
      where.authorId = query.authorId;
    }
    if (query.reviewerId) {
      where.reviewerId = query.reviewerId;
    }

    if (!isManagerOrAbove(role)) {
      where.OR = [
        { authorId: userId },
        { reviewerId: userId },
        { reviewers: { some: { reviewerId: userId } } },
        { mergedById: userId },
      ];
    }

    const take = query.limit ?? 20;
    const page = query.page ?? 1;
    const skip = (page - 1) * take;

    const [pullRequests, total] = await Promise.all([
      this.prisma.pullRequest.findMany({
        where,
        include: {
          task: {
            select: {
              id: true,
              title: true,
            },
          },
          author: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          mergedBy: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          reviewers: {
            include: {
              reviewer: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take,
      }),
      this.prisma.pullRequest.count({ where }),
    ]);

    return {
      data: pullRequests,
      meta: {
        total,
        page,
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  async findByTask(taskId: string, query: { page?: number; limit?: number }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [pullRequests, total] = await Promise.all([
      this.prisma.pullRequest.findMany({
        where: { taskId },
        include: {
          author: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          mergedBy: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          reviewers: {
            include: {
              reviewer: {
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
        skip,
        take: limit,
      }),
      this.prisma.pullRequest.count({ where: { taskId } }),
    ]);

    return {
      data: pullRequests,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const pullRequest = await this.prisma.pullRequest.findUnique({
      where: { id },
      include: {
        task: {
          select: {
            id: true,
            title: true,
          },
        },
        author: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        mergedBy: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        reviews: {
          include: {
            reviewer: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
        reviewers: {
          include: {
            reviewer: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
        commits: true,
      },
    });

    if (!pullRequest) {
      throw new NotFoundException('Pull request not found');
    }

    return pullRequest;
  }

  async update(id: string, dto: UpdatePrDto) {
    await this.findOne(id);

    const updated = await this.prisma.pullRequest.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.reviewerId !== undefined ? { reviewerId: dto.reviewerId } : {}),
        ...(dto.isDraft !== undefined ? { isDraft: dto.isDraft } : {}),
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
          },
        },
        author: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        mergedBy: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        reviewers: {
          include: {
            reviewer: {
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

    return updated;
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.pullRequest.delete({
      where: { id },
    });

    return {
      message: 'Pull request deleted successfully',
    };
  }

  async merge(id: string, mergedById: string, role: UserRole, dto: MergePrDto) {
    assertRole(role, ['SUPER_ADMIN', 'ADMIN', 'MANAGER']);

    const pullRequest = await this.findOne(id);

    if (pullRequest.status !== PRStatus.OPEN && pullRequest.status !== PRStatus.IN_REVIEW) {
      throw new BadRequestException(
        'Only OPEN or IN_REVIEW pull requests can be merged',
      );
    }

    if (pullRequest.reviews.length > 0) {
      const hasApprovedReview = pullRequest.reviews.some(
        (review) => review.status === ReviewStatus.APPROVED,
      );
      if (!hasApprovedReview) {
        throw new ForbiddenException(
          'At least one approved review is required before merging',
        );
      }
    }

    const updated = await this.prisma.pullRequest.update({
      where: { id },
      data: {
        status: PRStatus.MERGED,
        mergedAt: new Date(),
        mergedById,
        ...(dto.reviewerId !== undefined ? { reviewerId: dto.reviewerId } : {}),
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
          },
        },
        author: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        mergedBy: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    await this.prisma.pRReviewer.updateMany({
      where: { prId: id },
      data: { status: ReviewStatus.APPROVED },
    });

    if (pullRequest.taskId) {
      await this.activityService.logPRMerged(
        mergedById,
        id,
        pullRequest.title,
        pullRequest.taskId,
      );
    }

    return updated;
  }

  async assignReviewer(id: string, reviewerId: string) {
    const pullRequest = await this.findOne(id);

    const reviewer = await this.prisma.user.findUnique({
      where: { id: reviewerId },
    });

    if (!reviewer) {
      throw new NotFoundException('Reviewer not found');
    }

    const updated = await this.prisma.pullRequest.update({
      where: { id },
      data: {
        reviewerId,
        status: PRStatus.IN_REVIEW,
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
          },
        },
        author: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    await this.prisma.pRReviewer.upsert({
      where: {
        prId_reviewerId: {
          prId: id,
          reviewerId,
        },
      },
      update: {
        status: ReviewStatus.PENDING,
      },
      create: {
        prId: id,
        reviewerId,
        status: ReviewStatus.PENDING,
      },
    });

    return updated;
  }

  async addReviewer(id: string, dto: AddReviewerDto, userId: string, role: UserRole) {
    assertRole(role, ['SUPER_ADMIN', 'ADMIN', 'MANAGER']);

    const pullRequest = await this.prisma.pullRequest.findUnique({
      where: { id },
    });

    if (!pullRequest) {
      throw new NotFoundException('Pull request not found');
    }

    const reviewer = await this.prisma.user.findUnique({
      where: { id: dto.reviewerId },
    });

    if (!reviewer) {
      throw new NotFoundException('Reviewer not found');
    }

    const existing = await this.prisma.pRReviewer.findUnique({
      where: {
        prId_reviewerId: {
          prId: id,
          reviewerId: dto.reviewerId,
        },
      },
    });

    if (existing) {
      throw new ForbiddenException('This reviewer is already assigned to this PR');
    }

    return this.prisma.pRReviewer.create({
      data: {
        prId: id,
        reviewerId: dto.reviewerId,
        status: ReviewStatus.PENDING,
      },
      include: {
        reviewer: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }

  async removeReviewer(id: string, reviewerId: string, userId: string, role: UserRole) {
    assertRole(role, ['SUPER_ADMIN', 'ADMIN', 'MANAGER']);

    const existing = await this.prisma.pRReviewer.findUnique({
      where: {
        prId_reviewerId: {
          prId: id,
          reviewerId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Reviewer not found on this PR');
    }

    await this.prisma.pRReviewer.delete({
      where: { id: existing.id },
    });

    return { message: 'Reviewer removed successfully' };
  }

  async updateReviewerStatus(
    id: string,
    reviewerId: string,
    status: ReviewStatus,
    userId: string,
    role: UserRole,
  ) {
    const existing = await this.prisma.pRReviewer.findUnique({
      where: {
        prId_reviewerId: {
          prId: id,
          reviewerId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Reviewer not found on this PR');
    }

    if (existing.reviewerId !== userId && !isManagerOrAbove(role)) {
      throw new ForbiddenException('Only the reviewer or a manager can update review status');
    }

    return this.prisma.pRReviewer.update({
      where: { id: existing.id },
      data: { status },
      include: {
        reviewer: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }
}

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { ReviewStatus } from '@prisma/client';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { UserRole } from '@prisma/client';
import { assertRole, isManagerOrAbove } from '@/common/authorization/authorization';
import { IPaginationQuery } from '@/common/types/common.types';

@Injectable()
export class CodeReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateReviewDto, userId: string, role: UserRole) {
    if (!isManagerOrAbove(role)) {
      throw new ForbiddenException('Only managers and administrators can create code reviews');
    }

    const pullRequest = await this.prisma.pullRequest.findUnique({
      where: { id: dto.prId },
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

    const existingReview = await this.prisma.codeReview.findUnique({
      where: {
        prId_reviewerId: {
          prId: dto.prId,
          reviewerId: dto.reviewerId,
        },
      },
    });

    if (existingReview) {
      throw new ForbiddenException('A review from this reviewer for this pull request already exists');
    }

    return this.prisma.codeReview.create({
      data: {
        prId: dto.prId,
        reviewerId: dto.reviewerId,
        status: dto.status ?? ReviewStatus.PENDING,
        comments: dto.comments,
      },
      include: {
        pullRequest: {
          select: {
            id: true,
            title: true,
          },
        },
        reviewer: {
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

  async findAll(
    prId: string | undefined,
    reviewerId: string | undefined,
    query: IPaginationQuery,
    userId: string,
    role: UserRole,
  ) {
    const where: Record<string, string> = {};

    if (prId) {
      where.prId = prId;
    }

    if (reviewerId) {
      if (!isManagerOrAbove(role) && reviewerId !== userId) {
        throw new ForbiddenException('You can only view your own reviews');
      }
      where.reviewerId = reviewerId;
    }

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.codeReview.findMany({
        where,
        include: {
          pullRequest: {
            select: {
              id: true,
              title: true,
            },
          },
          reviewer: {
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
        take: limit,
      }),
      this.prisma.codeReview.count({ where }),
    ]);

    return {
      data: reviews,
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

    const review = await this.prisma.codeReview.findUnique({
      where: { id },
      include: {
        pullRequest: {
          select: {
            id: true,
            title: true,
            authorId: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundException('Code review not found');
    }

    return review;
  }

  async canModifyReview(review: any, userId: string, role: UserRole): Promise<boolean> {
    if (isManagerOrAbove(role)) {
      return true;
    }
    if (review.reviewerId === userId) {
      return true;
    }
    if (review.pullRequest.authorId === userId) {
      return true;
    }
    return false;
  }

  async update(id: string, dto: UpdateReviewDto, userId: string, role: UserRole) {
    const review = await this.findOne(id, userId, role);

    if (!(await this.canModifyReview(review, userId, role))) {
      throw new ForbiddenException(
        'Only the reviewer, PR author, or a manager/administrator can update this review',
      );
    }

    return this.prisma.codeReview.update({
      where: { id },
      data: {
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.comments !== undefined ? { comments: dto.comments } : {}),
      },
      include: {
        pullRequest: {
          select: {
            id: true,
            title: true,
          },
        },
        reviewer: {
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
      throw new ForbiddenException('Only managers and administrators can delete code reviews');
    }

    await this.findOne(id, userId, role);

    await this.prisma.codeReview.delete({
      where: { id },
    });

    return {
      message: 'Code review deleted successfully',
    };
  }
}

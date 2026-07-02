import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateRequestAccessDto } from './dto/create-request-access.dto';
import { UserRole, RequestStatus } from '@prisma/client';
import { assertRole, isManagerOrAbove } from '@/common/authorization/authorization';
import { IPaginationQuery } from '@/common/types/common.types';
import * as bcrypt from 'bcrypt';

@Injectable()
export class RequestAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRequestAccessDto) {
    const existing = await this.prisma.requestAccess.findFirst({
      where: { email: dto.email, status: 'PENDING' },
    });
    if (existing) {
      throw new ForbiddenException('A pending request already exists for this email');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ForbiddenException('An account with this email already exists');
    }

    return this.prisma.requestAccess.create({
      data: dto,
    });
  }

  async findAll(
    query: IPaginationQuery & { status?: string; search?: string },
    role: UserRole,
  ) {
    assertRole(role, ['SUPER_ADMIN', 'ADMIN', 'MANAGER']);

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (query.status) {
      where.status = query.status as RequestStatus;
    }

    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [requests, total] = await Promise.all([
      this.prisma.requestAccess.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, email: true, name: true },
          },
        },
      }),
      this.prisma.requestAccess.count({ where }),
    ]);

    return {
      data: requests,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findPending(query: IPaginationQuery, role: UserRole) {
    assertRole(role, ['SUPER_ADMIN', 'ADMIN', 'MANAGER']);

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      this.prisma.requestAccess.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, email: true, name: true },
          },
        },
      }),
      this.prisma.requestAccess.count({ where: { status: 'PENDING' } }),
    ]);

    return {
      data: requests,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, role: UserRole) {
    assertRole(role, ['SUPER_ADMIN', 'ADMIN', 'MANAGER']);
    const request = await this.prisma.requestAccess.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    return request;
  }

  async approve(id: string, reviewerId: string, role: UserRole) {
    if (!isManagerOrAbove(role)) {
      throw new ForbiddenException('Only managers and administrators can approve requests');
    }

    const request = await this.prisma.requestAccess.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.status !== 'PENDING') {
      throw new ForbiddenException('This request has already been processed');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: request.email },
    });

    let userId: string;
    if (existingUser) {
      userId = existingUser.id;
    } else {
      const randomPassword = Math.random().toString(36).slice(-10);
      const newUser = await this.prisma.user.create({
        data: {
          email: request.email,
          name: request.name,
          password: await bcrypt.hash(randomPassword, 10),
          department: request.department || undefined,
          jobTitle: request.jobTitle || undefined,
          role: 'EMPLOYEE',
          isActive: true,
        },
        select: { id: true },
      });
      userId = newUser.id;
    }

    const approved = await this.prisma.requestAccess.update({
      where: { id },
      data: {
        status: 'APPROVED',
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        userId,
      },
    });

    return approved;
  }

  async reject(id: string, reviewerId: string, role: UserRole) {
    if (!isManagerOrAbove(role)) {
      throw new ForbiddenException('Only managers and administrators can reject requests');
    }

    const request = await this.prisma.requestAccess.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.status !== 'PENDING') {
      throw new ForbiddenException('This request has already been processed');
    }

    return this.prisma.requestAccess.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
      },
    });
  }
}

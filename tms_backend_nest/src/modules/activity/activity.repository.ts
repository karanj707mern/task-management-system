import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';

export interface ICreateActivity {
  userId: string;
  taskId?: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: string;
  newValue?: string;
}

@Injectable()
export class ActivityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: ICreateActivity) {
    return this.prisma.activity.create({
      data,
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

  async findById(id: string) {
    return this.prisma.activity.findUnique({
      where: { id },
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

  async findByTaskId(taskId: string, skip: number, take: number) {
    return this.prisma.activity.findMany({
      where: { taskId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  async findByUserId(userId: string, skip: number, take: number) {
    return this.prisma.activity.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  async findByEntityType(entityType: string, skip: number, take: number) {
    return this.prisma.activity.findMany({
      where: { entityType },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  async countByTaskId(taskId: string) {
    return this.prisma.activity.count({
      where: { taskId },
    });
  }

  async countByUserId(userId: string) {
    return this.prisma.activity.count({
      where: { userId },
    });
  }

  async countByEntityType(entityType: string) {
    return this.prisma.activity.count({
      where: { entityType },
    });
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    data: Omit<Prisma.NotificationCreateInput, 'user'>,
  ) {
    return this.prisma.notification.create({
      data: {
        ...data,
        user: { connect: { id: userId } },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.notification.findUnique({
      where: { id },
    });
  }

  async findByUserId(userId: string, skip: number, take: number) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  async countByUserId(userId: string) {
    return this.prisma.notification.count({
      where: { userId },
    });
  }

  async countUnreadByUserId(userId: string) {
    return this.prisma.notification.count({
      where: { userId, read: false },
    });
  }

  async markAsRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  async delete(id: string) {
    return this.prisma.notification.delete({
      where: { id },
    });
  }

  async deleteByUserId(userId: string) {
    return this.prisma.notification.deleteMany({
      where: { userId },
    });
  }
}

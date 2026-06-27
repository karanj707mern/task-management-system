import { IPaginationQuery } from '@/common/types/common.types';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { NotificationRepository } from './notifications.repository';

export interface ICreateNotification {
  title: string;
  message: string;
  type?: string;
  referenceId?: string;
  referenceType?: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async createNotification(userId: string, data: ICreateNotification) {
    return this.notificationRepository.create(userId, {
      title: data.title,
      message: data.message,
      type: data.type || 'INFO',
      referenceId: data.referenceId,
      referenceType: data.referenceType,
    } as Omit<Prisma.NotificationCreateInput, 'user'>);
  }

  async getNotification(id: string, userId: string) {
    const notification = await this.notificationRepository.findById(id);
    if (!notification || notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }
    return notification;
  }

  async getUserNotifications(userId: string, query: IPaginationQuery) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [notifications, total, unread] = await Promise.all([
      this.notificationRepository.findByUserId(userId, skip, limit),
      this.notificationRepository.countByUserId(userId),
      this.notificationRepository.countUnreadByUserId(userId),
    ]);

    return {
      data: notifications,
      meta: {
        total,
        unread,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async markAsRead(id: string, userId: string) {
    await this.getNotification(id, userId);
    return this.notificationRepository.markAsRead(id);
  }

  async markAllAsRead(userId: string) {
    return this.notificationRepository.markAllAsRead(userId);
  }

  async deleteNotification(id: string, userId: string) {
    await this.getNotification(id, userId);
    await this.notificationRepository.delete(id);
    return { message: 'Notification deleted successfully' };
  }

  async deleteAllNotifications(userId: string) {
    await this.notificationRepository.deleteByUserId(userId);
    return { message: 'All notifications deleted successfully' };
  }

  async getUnreadCount(userId: string) {
    const count = await this.notificationRepository.countUnreadByUserId(userId);
    return { unread: count };
  }
}

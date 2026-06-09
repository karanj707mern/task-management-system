import { Injectable, NotFoundException } from '@nestjs/common';
import { ActivityRepository, ICreateActivity } from './activity.repository';
import { IPaginationQuery } from '@/common/types/common.types';

@Injectable()
export class ActivityService {
  constructor(private readonly activityRepository: ActivityRepository) {}

  async logActivity(data: ICreateActivity) {
    return this.activityRepository.create(data);
  }

  async getActivity(id: string) {
    const activity = await this.activityRepository.findById(id);
    if (!activity) {
      throw new NotFoundException('Activity not found');
    }
    return activity;
  }

  async getTaskActivity(taskId: string, query: IPaginationQuery) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      this.activityRepository.findByTaskId(taskId, skip, limit),
      this.activityRepository.countByTaskId(taskId),
    ]);

    return {
      data: activities,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserActivity(userId: string, query: IPaginationQuery) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      this.activityRepository.findByUserId(userId, skip, limit),
      this.activityRepository.countByUserId(userId),
    ]);

    return {
      data: activities,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getEntityActivity(entityType: string, query: IPaginationQuery) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      this.activityRepository.findByEntityType(entityType, skip, limit),
      this.activityRepository.countByEntityType(entityType),
    ]);

    return {
      data: activities,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  logTaskCreated(userId: string, taskId: string, taskTitle: string) {
    return this.logActivity({
      userId,
      taskId,
      action: 'CREATED',
      entityType: 'TASK',
      entityId: taskId,
      newValue: taskTitle,
    });
  }

  logTaskUpdated(
    userId: string,
    taskId: string,
    oldValue: string,
    newValue: string,
  ) {
    return this.logActivity({
      userId,
      taskId,
      action: 'UPDATED',
      entityType: 'TASK',
      entityId: taskId,
      oldValue,
      newValue,
    });
  }

  logTaskStatusChanged(
    userId: string,
    taskId: string,
    oldStatus: string,
    newStatus: string,
  ) {
    return this.logActivity({
      userId,
      taskId,
      action: 'STATUS_CHANGED',
      entityType: 'TASK',
      entityId: taskId,
      oldValue: oldStatus,
      newValue: newStatus,
    });
  }

  logCommentAdded(userId: string, taskId: string, commentId: string) {
    return this.logActivity({
      userId,
      taskId,
      action: 'CREATED',
      entityType: 'COMMENT',
      entityId: commentId,
    });
  }

  logCommentDeleted(userId: string, taskId: string, commentId: string) {
    return this.logActivity({
      userId,
      taskId,
      action: 'DELETED',
      entityType: 'COMMENT',
      entityId: commentId,
    });
  }
}

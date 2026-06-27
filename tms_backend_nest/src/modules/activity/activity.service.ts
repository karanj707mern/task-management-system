import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ActivityRepository, ICreateActivity } from './activity.repository';
import { IPaginationQuery } from '@/common/types/common.types';
import { UserRole } from '@prisma/client';
import { assertRole, isManagerOrAbove } from '@/common/authorization/authorization';

@Injectable()
export class ActivityService {
  constructor(private readonly activityRepository: ActivityRepository) {}

  async logActivity(data: ICreateActivity) {
    return this.activityRepository.create(data);
  }

  async findAll(query: IPaginationQuery, role: UserRole) {
    assertRole(role, ['SUPER_ADMIN', 'ADMIN', 'MANAGER']);

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      this.activityRepository.findAll(skip, limit),
      this.activityRepository.countAll(),
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

  async getProjectActivity(projectId: string, query: IPaginationQuery, role: UserRole) {
    assertRole(role, ['SUPER_ADMIN', 'ADMIN', 'MANAGER']);

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      this.activityRepository.findByProjectId(projectId, skip, limit),
      this.activityRepository.countByProjectId(projectId),
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

  async getActivity(id: string, userId: string, role: UserRole) {
    assertRole(role, ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER']);
    const activity = await this.activityRepository.findById(id);
    if (!activity || (!isManagerOrAbove(role) && activity.userId !== userId)) {
      throw new NotFoundException('Activity not found');
    }
    return activity;
  }

  async getTaskActivity(
    taskId: string,
    query: IPaginationQuery,
    userId: string,
    role: UserRole,
  ) {
    assertRole(role, ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER']);
    if (!isManagerOrAbove(role)) {
      const task = await this.activityRepository.findTaskAccess(taskId, userId);
      if (!task) {
        throw new ForbiddenException('You do not have access to this task');
      }
    }

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

  async getUserActivity(
    userId: string,
    query: IPaginationQuery,
    currentUserId: string,
    role: UserRole,
  ) {
    assertRole(role, ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER']);
    if (!isManagerOrAbove(role) && userId !== currentUserId) {
      throw new ForbiddenException('You can only view your own activity');
    }

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

  async getEntityActivity(entityType: string, query: IPaginationQuery, role: UserRole) {
    assertRole(role, ['SUPER_ADMIN', 'ADMIN', 'MANAGER']);
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

  logCommitCreated(userId: string, commitId: string, branchName: string, taskId?: string) {
    return this.logActivity({
      userId,
      taskId,
      action: 'COMMITTED',
      entityType: 'COMMIT',
      entityId: commitId,
      newValue: branchName,
      metadata: { branchName },
    });
  }

  logBranchCreated(userId: string, branchId: string, branchName: string, taskId?: string) {
    return this.logActivity({
      userId,
      taskId,
      action: 'CREATED',
      entityType: 'BRANCH',
      entityId: branchId,
      newValue: branchName,
      metadata: { branchName },
    });
  }

  logPRCreated(userId: string, prId: string, sourceBranch: string, targetBranch: string, taskId: string) {
    return this.logActivity({
      userId,
      taskId,
      action: 'CREATED',
      entityType: 'PULL_REQUEST',
      entityId: prId,
      newValue: `${sourceBranch} → ${targetBranch}`,
      metadata: { sourceBranch, targetBranch },
    });
  }

  logPRMerged(userId: string, prId: string, title: string, taskId?: string) {
    return this.logActivity({
      userId,
      taskId,
      action: 'MERGED',
      entityType: 'PULL_REQUEST',
      entityId: prId,
      newValue: title,
      metadata: { title },
    });
  }
}

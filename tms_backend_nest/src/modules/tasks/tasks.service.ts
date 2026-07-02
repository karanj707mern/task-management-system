import { ForbiddenException, Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { TaskStatus, LinkType } from '@prisma/client';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ArchiveTaskDto } from './dto/archive-task.dto';
import { UserRole } from '@prisma/client';
import { assertRole, isManagerOrAbove, canDeleteResource, canArchiveResource } from '@/common/authorization/authorization';
import { TasksQueryDto } from '@/common/dto/pagination-query.dto';
import { DomainEventEmitter } from '../../events/emitters/domain-event.emitter';
import { Permission, PermissionService } from '@/shared/permissions/permission.service';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: DomainEventEmitter,
    private readonly permissionService: PermissionService,
  ) {}

  async create(dto: CreateTaskDto, userId: string, role: UserRole) {
    this.permissionService.checkPermission(role, Permission.CREATE_TASK);
    if (!isManagerOrAbove(role)) {
      dto.assigneeId = userId;
    }

    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: dto.assigneeId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        projectId: dto.projectId,
        assigneeId: dto.assigneeId,
        createdById: userId,
        dueDate: dto.dueDate,
        estimatedHours: dto.estimatedHours,
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.priority ? { priority: dto.priority } : {}),
        ...(dto.storyPoints !== undefined ? { storyPoints: dto.storyPoints } : {}),
        ...(dto.epicId ? { epicId: dto.epicId } : {}),
        ...(dto.sprintId ? { sprintId: dto.sprintId } : {}),
        ...(dto.parentTaskId ? { parentTaskId: dto.parentTaskId } : {}),
        ...(dto.externalId ? { externalId: dto.externalId } : {}),
        ...(dto.externalKey ? { externalKey: dto.externalKey } : {}),
        ...(dto.tags ? { tags: dto.tags } : {}),
      },
      include: {
        assignee: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    await this.prisma.activity.create({
      data: {
        userId,
        taskId: task.id,
        action: 'created',
        entityType: 'task',
        entityId: task.id,
        metadata: { title: task.title },
      },
    });

    this.eventEmitter.emitTaskCreated({
      id: task.id,
      title: task.title,
      projectId: task.projectId,
      assigneeEmail: task.assignee.email,
      assigneeName: task.assignee.name,
      projectName: task.project.name,
      createdAt: task.createdAt,
    });

    return task;
  }

  async findAll(userId: string, role: UserRole, query?: TasksQueryDto) {
    this.permissionService.checkPermission(role, Permission.READ_TASK);
    assertRole(role, ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER']);

    const baseWhere = isManagerOrAbove(role)
      ? {}
      : { OR: [{ assigneeId: userId }, { createdById: userId }] };

    const filters: Record<string, unknown> = {};
    if (query?.projectId) filters.projectId = query.projectId;
    if (query?.assigneeId) filters.assigneeId = query.assigneeId;
    if (query?.epicId) filters.epicId = query.epicId;
    if (query?.sprintId) filters.sprintId = query.sprintId;
    if (query?.status) filters.status = query.status;
    if (query?.priority) filters.priority = query.priority;
    if (query?.parentTaskId) filters.parentTaskId = query.parentTaskId;
    if (query?.search) {
      filters.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const where = Object.keys(baseWhere).length > 0
      ? { AND: [baseWhere, filters] }
      : filters;

    const take = query?.limit ?? 100;
    const page = query?.page ?? 1;
    const skip = (page - 1) * take;

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        include: {
          assignee: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
            },
          },
          subTasks: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take,
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      data: tasks,
      meta: {
        total,
        page,
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  async getBoard(userId: string, role: UserRole, projectId?: string, sprintId?: string) {
    this.permissionService.checkPermission(role, Permission.READ_TASK);
    assertRole(role, ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER']);

    const baseWhere: Record<string, unknown> = {};
    if (!isManagerOrAbove(role)) {
      baseWhere.OR = [{ assigneeId: userId }, { createdById: userId }];
    }
    if (projectId) baseWhere.projectId = projectId;
    if (sprintId) baseWhere.sprintId = sprintId;

    const statuses: TaskStatus[] = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.IN_REVIEW, TaskStatus.DONE, TaskStatus.BLOCKED, TaskStatus.CANCELLED];

    const columns = await Promise.all(
      statuses.map(async (status) => {
        const tasks = await this.prisma.task.findMany({
          where: { ...baseWhere, status },
          include: {
            assignee: { select: { id: true, email: true, name: true, role: true } },
            project: { select: { id: true, name: true } },
            epic: { select: { id: true, name: true, color: true } },
            sprint: { select: { id: true, name: true, status: true } },
          },
          orderBy: { createdAt: 'desc' },
        });
        return { status, tasks };
      }),
    );

    return columns;
  }

  async findOne(id: string, userId: string, role: UserRole) {
    this.permissionService.checkPermission(role, Permission.READ_TASK);
    assertRole(role, ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER']);
    const task = await this.prisma.task.findUnique({
      where: isManagerOrAbove(role)
        ? { id }
        : {
            id,
            OR: [{ assigneeId: userId }, { createdById: userId }],
          },
      include: {
        assignee: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        parentTask: true,
        subTasks: true,
        workLogs: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async updateStatus(id: string, status: TaskStatus, userId: string, role: UserRole) {
    this.permissionService.checkPermission(role, Permission.UPDATE_TASK);
    const task = await this.findOne(id, userId, role);
    if (!isManagerOrAbove(role) && task.assigneeId !== userId && task.createdById !== userId) {
      throw new ForbiddenException('You can only update tasks assigned to you');
    }

    const oldStatus = task.status;

    const updated = await this.prisma.task.update({
      where: { id },
      data: { status },
      include: {
        assignee: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    this.eventEmitter.emitTaskStatusChanged({
      id: task.id,
      title: task.title,
      oldStatus,
      newStatus: status,
      changedBy: userId,
      assigneeEmail: task.assignee?.email,
      assigneeName: task.assignee?.name,
      projectName: task.project?.name,
      changedAt: new Date(),
    });

    return updated;
  }

  async update(id: string, dto: UpdateTaskDto, userId: string, role: UserRole) {
    this.permissionService.checkPermission(role, Permission.UPDATE_TASK);
    await this.findOne(id, userId, role);

    const updated = await this.prisma.task.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
        ...(dto.assigneeId !== undefined ? { assigneeId: dto.assigneeId } : {}),
        ...(dto.parentTaskId !== undefined ? { parentTaskId: dto.parentTaskId } : {}),
        ...(dto.dueDate !== undefined ? { dueDate: dto.dueDate } : {}),
        ...(dto.estimatedHours !== undefined ? { estimatedHours: dto.estimatedHours } : {}),
        ...(dto.tags !== undefined ? { tags: dto.tags } : {}),
        ...(dto.storyPoints !== undefined ? { storyPoints: dto.storyPoints } : {}),
        ...(dto.epicId !== undefined ? { epicId: dto.epicId || null } : {}),
        ...(dto.sprintId !== undefined ? { sprintId: dto.sprintId || null } : {}),
        ...(dto.externalId !== undefined ? { externalId: dto.externalId } : {}),
        ...(dto.externalKey !== undefined ? { externalKey: dto.externalKey } : {}),
      },
      include: {
        assignee: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        parentTask: {
          select: {
            id: true,
            title: true,
          },
        },
        subTasks: true,
      },
    });

    await this.prisma.activity.create({
      data: {
        userId,
        taskId: id,
        action: 'updated',
        entityType: 'task',
        entityId: id,
        metadata: { title: updated.title },
      },
    });

    return updated;
  }

  async remove(id: string, userId: string, role: UserRole) {
    if (!canDeleteResource(role)) {
      throw new ForbiddenException('Only administrators can permanently delete tasks');
    }
    await this.findOne(id, userId, role);

    await this.prisma.task.delete({
      where: { id },
    });

    return {
      message: 'Task deleted successfully',
    };
  }

  async archive(id: string, dto: ArchiveTaskDto, userId: string, role: UserRole) {
    if (!canArchiveResource(role)) {
      throw new ForbiddenException('Only managers and administrators can archive tasks');
    }
    const task = await this.findOne(id, userId, role);

    const updated = await this.prisma.task.update({
      where: { id },
      data: { status: dto.status },
      include: {
        assignee: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    await this.prisma.activity.create({
      data: {
        userId,
        taskId: id,
        action: 'archived',
        entityType: 'task',
        entityId: id,
        metadata: { title: task.title },
      },
    });

    return updated;
  }

  async linkTasks(taskId: string, linkedTaskId: string, linkType: LinkType) {
    const existing = await this.prisma.taskLink.findFirst({
      where: { taskId, linkedTaskId },
    });
    if (existing) {
      throw new ConflictException('Tasks are already linked');
    }

    return this.prisma.taskLink.create({
      data: { taskId, linkedTaskId, linkType },
    });
  }

  async unlinkTasks(taskId: string, linkedTaskId: string) {
    return this.prisma.taskLink.deleteMany({
      where: { OR: [{ taskId, linkedTaskId }, { taskId: linkedTaskId, linkedTaskId: taskId }] },
    });
  }

  async getTaskLinks(taskId: string) {
    return this.prisma.taskLink.findMany({
      where: { OR: [{ taskId }, { linkedTaskId: taskId }] },
    });
  }

  async addWatcher(taskId: string, userId: string) {
    const existing = await this.prisma.taskWatcher.findFirst({
      where: { taskId, userId },
    });
    if (existing) {
      return existing;
    }
    return this.prisma.taskWatcher.create({
      data: { taskId, userId },
    });
  }

  async removeWatcher(taskId: string, userId: string) {
    return this.prisma.taskWatcher.deleteMany({
      where: { taskId, userId },
    });
  }

  async getWatchers(taskId: string) {
    return this.prisma.taskWatcher.findMany({
      where: { taskId },
    });
  }

  async createWorkLog(taskId: string, userId: string, hours: number, description?: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const workLog = await this.prisma.workLog.create({
      data: { taskId, userId, hours, description },
    });

    const totalHours = await this.prisma.workLog.aggregate({
      where: { taskId },
      _sum: { hours: true },
    });

    await this.prisma.task.update({
      where: { id: taskId },
      data: { actualHours: totalHours._sum.hours || 0 },
    });

    return workLog;
  }

  async getWorkLogs(taskId: string) {
    return this.prisma.workLog.findMany({
      where: { taskId },
      orderBy: { date: 'desc' },
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

  async updateWorkLog(
    taskId: string,
    worklogId: string,
    hours: number,
    description?: string,
    userId?: string,
    role?: UserRole,
  ) {
    const workLog = await this.prisma.workLog.findUnique({
      where: { id: worklogId },
    });

    if (!workLog) {
      throw new NotFoundException('Work log not found');
    }

    assertRole(role!, ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER']);

    if (!isManagerOrAbove(role!) && workLog.userId !== userId) {
      throw new ForbiddenException('You can only update your own work logs');
    }

    const updated = await this.prisma.workLog.update({
      where: { id: worklogId },
      data: {
        ...(hours !== undefined ? { hours } : {}),
        ...(description !== undefined ? { description } : {}),
      },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    const totalHours = await this.prisma.workLog.aggregate({
      where: { taskId },
      _sum: { hours: true },
    });

    await this.prisma.task.update({
      where: { id: taskId },
      data: { actualHours: totalHours._sum.hours || 0 },
    });

    return updated;
  }

  async deleteWorkLog(
    taskId: string,
    worklogId: string,
    userId: string,
    role: UserRole,
  ) {
    assertRole(role, ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER']);

    const workLog = await this.prisma.workLog.findUnique({
      where: { id: worklogId },
    });

    if (!workLog) {
      throw new NotFoundException('Work log not found');
    }

    if (!isManagerOrAbove(role) && workLog.userId !== userId) {
      throw new ForbiddenException('You can only delete your own work logs');
    }

    await this.prisma.workLog.delete({
      where: { id: worklogId },
    });

    const totalHours = await this.prisma.workLog.aggregate({
      where: { taskId },
      _sum: { hours: true },
    });

    await this.prisma.task.update({
      where: { id: taskId },
      data: { actualHours: totalHours._sum.hours || 0 },
    });

    return { message: 'Work log deleted successfully' };
  }
}
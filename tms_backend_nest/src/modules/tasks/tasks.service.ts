import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { TaskStatus } from '@prisma/client';
import { CreateTaskDto } from './dto/create-task.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTaskDto) {
    const project = await this.prisma.project.findUnique({
      where: {
        id: dto.projectId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: dto.assigneeId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        projectId: dto.projectId,
        assigneeId: dto.assigneeId,
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
        project: true,
      },
    });
  }

  async findAll() {
    return this.prisma.task.findMany({
      include: {
        assignee: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
        project: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
      where: {
        id,
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
        project: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async updateStatus(id: string, status: TaskStatus) {
    await this.findOne(id);

    return this.prisma.task.update({
      where: {
        id,
      },
      data: {
        status,
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
        project: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.task.delete({
      where: {
        id,
      },
    });

    return {
      message: 'Task deleted successfully',
    };
  }
}

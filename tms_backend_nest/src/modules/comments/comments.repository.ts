import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateCommentDto, authorId: string) {
    return this.prisma.comment.create({
      data: {
        content: data.content,
        taskId: data.taskId,
        authorId,
      },
      include: {
        author: {
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
    return this.prisma.comment.findUnique({
      where: { id },
      include: {
        author: {
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
    return this.prisma.comment.findMany({
      where: { taskId },
      include: {
        author: {
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
    return this.prisma.comment.count({
      where: { taskId },
    });
  }

  async update(id: string, data: UpdateCommentDto) {
    return this.prisma.comment.update({
      where: { id },
      data,
      include: {
        author: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }

  async delete(id: string) {
    return this.prisma.comment.delete({
      where: { id },
    });
  }
}

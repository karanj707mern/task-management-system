import { DomainEventEmitter } from '@/events/emitters/domain-event.emitter';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class AttachmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: DomainEventEmitter,
  ) {}

  async   upload(taskId: string, userId: string, file: { filename: string; originalname: string; mimetype: string; size: number }) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const url = `/uploads/documents/${file.filename}`;

    const attachment = await this.prisma.attachment.create({
      data: {
        url,
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        taskId,
        userId,
      },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    return attachment;
  }

  async findAll(taskId: string) {
    return this.prisma.attachment.findMany({
      where: { taskId },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(id: string, userId: string) {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    if (attachment.userId !== userId) {
      throw new ForbiddenException('You can only delete your own attachments');
    }

    await this.prisma.attachment.delete({
      where: { id },
    });

    return { message: 'Attachment deleted successfully' };
  }
}

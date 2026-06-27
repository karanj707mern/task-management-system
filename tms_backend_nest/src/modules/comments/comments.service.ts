import { IPaginationQuery } from '@/common/types/common.types';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CommentRepository } from './comments.repository';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class CommentsService {
  constructor(
    private readonly commentRepository: CommentRepository,
    private readonly prisma: PrismaService,
  ) {}

  async createComment(createCommentDto: CreateCommentDto, userId: string) {
    const comment = await this.commentRepository.create(createCommentDto, userId);
    
    const mentionedUserIds = this.extractMentions(createCommentDto.content);
    if (mentionedUserIds.length > 0) {
      await this.notifyMentionedUsers(comment.id, mentionedUserIds, userId);
    }
    
    return comment;
  }

  private extractMentions(content: string): string[] {
    const mentionPattern = /@([a-zA-Z0-9_-]+)/g;
    const matches = content.matchAll(mentionPattern);
    return Array.from(matches, m => m[1]);
  }

  private async notifyMentionedUsers(commentId: string, usernames: string[], authorId: string) {
    for (const username of usernames) {
      const user = await this.prisma.user.findFirst({
        where: { name: { contains: username, mode: 'insensitive' } },
      });
      if (user && user.id !== authorId) {
        await this.prisma.notification.create({
          data: {
            userId: user.id,
            title: 'Mention in comment',
            message: 'You were mentioned in a comment',
            type: NotificationType.COMMENT_ADDED,
            referenceId: commentId,
            referenceType: 'comment',
          },
        });
      }
    }
  }

  async getComment(id: string) {
    const comment = await this.commentRepository.findById(id);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    return comment;
  }

  async getTaskComments(taskId: string, query: IPaginationQuery) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      this.commentRepository.findByTaskId(taskId, skip, limit),
      this.commentRepository.countByTaskId(taskId),
    ]);

    return {
      data: comments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateComment(
    id: string,
    updateCommentDto: UpdateCommentDto,
    userId: string,
  ) {
    const comment = await this.getComment(id);

    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only update your own comments');
    }

    return this.commentRepository.update(id, updateCommentDto);
  }

  async deleteComment(id: string, userId: string) {
    const comment = await this.getComment(id);

    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.commentRepository.delete(id);
    return { message: 'Comment deleted successfully' };
  }
}

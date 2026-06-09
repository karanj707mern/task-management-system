import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CommentRepository } from './comments.repository';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { IPaginationQuery } from '@/common/types/common.types';

@Injectable()
export class CommentsService {
  constructor(private readonly commentRepository: CommentRepository) {}

  async createComment(createCommentDto: CreateCommentDto, userId: string) {
    return this.commentRepository.create(createCommentDto, userId);
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

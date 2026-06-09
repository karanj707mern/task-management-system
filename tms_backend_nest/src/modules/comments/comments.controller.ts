import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { IPaginationQuery } from '@/common/types/common.types';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { GetUser } from '@/common/decorators/get-user.decorator';

@Controller('comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createComment(
    @Body() createCommentDto: CreateCommentDto,
    @GetUser('id') userId: string,
  ) {
    return this.commentsService.createComment(createCommentDto, userId);
  }

  @Get(':id')
  async getComment(@Param('id') id: string) {
    return this.commentsService.getComment(id);
  }

  @Get('task/:taskId')
  async getTaskComments(
    @Param('taskId') taskId: string,
    @Query() query: IPaginationQuery,
  ) {
    return this.commentsService.getTaskComments(taskId, query);
  }

  @Patch(':id')
  async updateComment(
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @GetUser('id') userId: string,
  ) {
    return this.commentsService.updateComment(id, updateCommentDto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteComment(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.commentsService.deleteComment(id, userId);
  }
}

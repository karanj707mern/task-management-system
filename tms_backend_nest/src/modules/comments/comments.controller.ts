import { GetUser } from '@/common/decorators/get-user.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import type { IPaginationQuery } from '@/common/types/common.types';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';

@Controller('comments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER')
  async createComment(
    @Body() createCommentDto: CreateCommentDto,
    @GetUser('userId') userId: string,
  ) {
    return this.commentsService.createComment(createCommentDto, userId);
  }

  @Get('task/:taskId')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER')
  async getTaskComments(
    @Param('taskId') taskId: string,
    @Query() query: IPaginationQuery,
  ) {
    return this.commentsService.getTaskComments(taskId, query);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER')
  async getComment(@Param('id') id: string) {
    return this.commentsService.getComment(id);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER')
  async updateComment(
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @GetUser('userId') userId: string,
  ) {
    return this.commentsService.updateComment(id, updateCommentDto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER')
  async deleteComment(@Param('id') id: string, @GetUser('userId') userId: string) {
    return this.commentsService.deleteComment(id, userId);
  }
}

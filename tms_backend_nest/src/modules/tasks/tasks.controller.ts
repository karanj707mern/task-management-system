import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { CreateWorkLogDto, LinkTasksDto } from './dto/task.dto';
import { TasksQueryDto } from '@/common/dto/pagination-query.dto';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { GetUser } from '@/common/decorators/get-user.decorator';
import { ParseCuidPipe } from '@/common/pipes/parse-cuid.pipe';
import { UserRole } from '@prisma/client';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(
    @Body() dto: CreateTaskDto,
    @GetUser('userId') userId: string,
    @GetUser('role') role: UserRole,
  ) {
    return this.tasksService.create(dto, userId, role);
  }

  @Get('board')
  getBoard(
    @GetUser('userId') userId: string,
    @GetUser('role') role: UserRole,
    @Query('projectId') projectId?: string,
    @Query('sprintId') sprintId?: string,
  ) {
    return this.tasksService.getBoard(userId, role, projectId, sprintId);
  }

  @Get()
  findAll(@GetUser('userId') userId: string, @GetUser('role') role: UserRole, @Query() query: TasksQueryDto) {
    return this.tasksService.findAll(userId, role, query);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseCuidPipe) id: string,
    @GetUser('userId') userId: string,
    @GetUser('role') role: UserRole,
  ) {
    return this.tasksService.findOne(id, userId, role);
  }

  @Patch(':id')
  update(
    @Param('id', ParseCuidPipe) id: string,
    @Body() dto: UpdateTaskDto,
    @GetUser('userId') userId: string,
    @GetUser('role') role: UserRole,
  ) {
    return this.tasksService.update(id, dto, userId, role);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseCuidPipe) id: string,
    @Body() dto: UpdateTaskStatusDto,
    @GetUser('userId') userId: string,
    @GetUser('role') role: UserRole,
  ) {
    return this.tasksService.updateStatus(id, dto.status, userId, role);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseCuidPipe) id: string,
    @GetUser('userId') userId: string,
    @GetUser('role') role: UserRole,
  ) {
    return this.tasksService.remove(id, userId, role);
  }

  @Get(':id/links')
  getLinks(@Param('id', ParseCuidPipe) id: string) {
    return this.tasksService.getTaskLinks(id);
  }

  @Post(':id/links')
  linkTasks(
    @Param('id', ParseCuidPipe) taskId: string,
    @Body() dto: LinkTasksDto,
  ) {
    return this.tasksService.linkTasks(taskId, dto.linkedTaskId, dto.linkType);
  }

  @Delete(':id/links/:linkedId')
  unlinkTasks(
    @Param('id', ParseCuidPipe) taskId: string,
    @Param('linkedId', ParseCuidPipe) linkedTaskId: string,
  ) {
    return this.tasksService.unlinkTasks(taskId, linkedTaskId);
  }

  @Post(':id/watch')
  watchTask(
    @Param('id', ParseCuidPipe) taskId: string,
    @GetUser('userId') userId: string,
  ) {
    return this.tasksService.addWatcher(taskId, userId);
  }

  @Delete(':id/watch')
  unwatchTask(
    @Param('id', ParseCuidPipe) taskId: string,
    @GetUser('userId') userId: string,
  ) {
    return this.tasksService.removeWatcher(taskId, userId);
  }

  @Get(':id/watchers')
  getWatchers(@Param('id', ParseCuidPipe) taskId: string) {
    return this.tasksService.getWatchers(taskId);
  }

  @Post(':id/worklogs')
  createWorkLog(
    @Param('id', ParseCuidPipe) taskId: string,
    @Body() dto: CreateWorkLogDto,
    @GetUser('userId') userId: string,
  ) {
    return this.tasksService.createWorkLog(taskId, userId, dto.hours, dto.description);
  }

  @Get(':id/worklogs')
  getWorkLogs(@Param('id', ParseCuidPipe) taskId: string) {
    return this.tasksService.getWorkLogs(taskId);
  }

  @Patch(':taskId/worklogs/:worklogId')
  updateWorkLog(
    @Param('taskId', ParseCuidPipe) taskId: string,
    @Param('worklogId', ParseCuidPipe) worklogId: string,
    @Body() dto: CreateWorkLogDto,
    @GetUser('userId') userId: string,
    @GetUser('role') role: UserRole,
  ) {
    return this.tasksService.updateWorkLog(taskId, worklogId, dto.hours, dto.description, userId, role);
  }

  @Delete(':taskId/worklogs/:worklogId')
  deleteWorkLog(
    @Param('taskId', ParseCuidPipe) taskId: string,
    @Param('worklogId', ParseCuidPipe) worklogId: string,
    @GetUser('userId') userId: string,
    @GetUser('role') role: UserRole,
  ) {
    return this.tasksService.deleteWorkLog(taskId, worklogId, userId, role);
  }
}

import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import type { IPaginationQuery } from '@/common/types/common.types';
import { ActivityService } from './activity.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { ParseUuidPipe } from '@/common/pipes/parse-uuid.pipe';

@Controller('activity')
@UseGuards(JwtAuthGuard)
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get(':id')
  async getActivity(@Param('id', ParseUuidPipe) id: string) {
    return this.activityService.getActivity(id);
  }

  @Get('task/:taskId')
  async getTaskActivity(
    @Param('taskId', ParseUuidPipe) taskId: string,
    @Query() query: IPaginationQuery,
  ) {
    return this.activityService.getTaskActivity(taskId, query);
  }

  @Get('user/:userId')
  async getUserActivity(
    @Param('userId', ParseUuidPipe) userId: string,
    @Query() query: IPaginationQuery,
  ) {
    return this.activityService.getUserActivity(userId, query);
  }

  @Get('entity/:entityType')
  async getEntityActivity(
    @Param('entityType') entityType: string,
    @Query() query: IPaginationQuery,
  ) {
    return this.activityService.getEntityActivity(entityType, query);
  }
}

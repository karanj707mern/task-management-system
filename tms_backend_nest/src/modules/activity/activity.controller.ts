import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import type { IPaginationQuery } from '@/common/types/common.types';
import { ActivityService } from './activity.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { ParseCuidPipe } from '@/common/pipes/parse-cuid.pipe';
import { GetUser } from '@/common/decorators/get-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('activity')
@UseGuards(JwtAuthGuard)
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN', 'MANAGER')
  findAll(@Query() query: IPaginationQuery, @GetUser('role') role: UserRole) {
    return this.activityService.findAll(query, role);
  }

  @Get('project/:projectId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN', 'MANAGER')
  getProjectActivity(
    @Param('projectId', ParseCuidPipe) projectId: string,
    @Query() query: IPaginationQuery,
    @GetUser('role') role: UserRole,
  ) {
    return this.activityService.getProjectActivity(projectId, query, role);
  }

   @Get('task/:taskId')
   async getTaskActivity(
     @Param('taskId', ParseCuidPipe) taskId: string,
     @Query() query: IPaginationQuery,
     @GetUser('userId') userId: string,
     @GetUser('role') role: UserRole,
   ) {
     return this.activityService.getTaskActivity(taskId, query, userId, role);
   }

   @Get('user/:userId')
   async getUserActivity(
     @Param('userId', ParseCuidPipe) userId: string,
     @Query() query: IPaginationQuery,
     @GetUser('userId') currentUserId: string,
     @GetUser('role') role: UserRole,
   ) {
     return this.activityService.getUserActivity(userId, query, currentUserId, role);
   }

   @Get('entity/:entityType')
   async getEntityActivity(
     @Param('entityType') entityType: string,
     @Query() query: IPaginationQuery,
     @GetUser('role') role: UserRole,
   ) {
     return this.activityService.getEntityActivity(entityType, query, role);
   }

   @Get(':id')
   async getActivity(
     @Param('id', ParseCuidPipe) id: string,
     @GetUser('userId') userId: string,
     @GetUser('role') role: UserRole,
   ) {
     return this.activityService.getActivity(id, userId, role);
   }
}

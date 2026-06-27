import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { IPaginationQuery } from '@/common/types/common.types';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { GetUser } from '@/common/decorators/get-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getUserNotifications(
    @GetUser('userId') userId: string,
    @Query() query: IPaginationQuery,
  ) {
    return this.notificationsService.getUserNotifications(userId, query);
  }

  @Get('unread/count')
  async getUnreadCount(@GetUser('userId') userId: string) {
    return this.notificationsService.getUnreadCount(userId);
  }

  @Get(':id')
  async getNotification(@Param('id') id: string, @GetUser('userId') userId: string) {
    return this.notificationsService.getNotification(id, userId);
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @GetUser('userId') userId: string) {
    return this.notificationsService.markAsRead(id, userId);
  }

  @Patch('read-all')
  async markAllAsRead(@GetUser('userId') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteNotification(@Param('id') id: string, @GetUser('userId') userId: string) {
    return this.notificationsService.deleteNotification(id, userId);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAllNotifications(@GetUser('userId') userId: string) {
    return this.notificationsService.deleteAllNotifications(userId);
  }
}

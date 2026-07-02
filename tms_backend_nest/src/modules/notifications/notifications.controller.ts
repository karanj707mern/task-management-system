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
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { GetUser } from '@/common/decorators/get-user.decorator';
import { ParseCuidPipe } from '@/common/pipes/parse-cuid.pipe';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER')
  async getUserNotifications(
    @GetUser('userId') userId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.notificationsService.getUserNotifications(userId, query);
  }

  @Get('unread/count')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER')
  async getUnreadCount(@GetUser('userId') userId: string) {
    return this.notificationsService.getUnreadCount(userId);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER')
  async getNotification(
    @Param('id', ParseCuidPipe) id: string,
    @GetUser('userId') userId: string,
  ) {
    return this.notificationsService.getNotification(id, userId);
  }

  @Patch(':id/read')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER')
  async markAsRead(
    @Param('id', ParseCuidPipe) id: string,
    @GetUser('userId') userId: string,
  ) {
    return this.notificationsService.markAsRead(id, userId);
  }

  @Patch('read-all')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER')
  async markAllAsRead(@GetUser('userId') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER')
  async deleteNotification(
    @Param('id', ParseCuidPipe) id: string,
    @GetUser('userId') userId: string,
  ) {
    return this.notificationsService.deleteNotification(id, userId);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'VIEWER')
  async deleteAllNotifications(@GetUser('userId') userId: string) {
    return this.notificationsService.deleteAllNotifications(userId);
  }
}

import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { EventsModule } from '../../events/events.module';
import { PermissionService } from '@/shared/permissions/permission.service';

@Module({
  imports: [PrismaModule, EventsModule],
  providers: [TasksService, PermissionService],
  controllers: [TasksController],
})
export class TasksModule {}
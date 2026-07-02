import { Module } from '@nestjs/common';

import { PrismaModule } from '../../infrastructure/prisma/prisma.module';

import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { PermissionService } from '@/shared/permissions/permission.service';

@Module({
  imports: [PrismaModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, PermissionService],
  exports: [ProjectsService],
})
export class ProjectsModule {}

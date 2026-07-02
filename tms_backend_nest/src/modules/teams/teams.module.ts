import { Module } from '@nestjs/common';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';
import { TeamRepository } from './teams.repository';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';
import { PermissionService } from '@/shared/permissions/permission.service';

@Module({
  imports: [PrismaModule],
  controllers: [TeamsController],
  providers: [TeamsService, TeamRepository, PermissionService],
  exports: [TeamsService, TeamRepository],
})
export class TeamsModule {}

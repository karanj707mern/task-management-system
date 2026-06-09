import { Module } from '@nestjs/common';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';
import { TeamRepository } from './teams.repository';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TeamsController],
  providers: [TeamsService, TeamRepository],
  exports: [TeamsService, TeamRepository],
})
export class TeamsModule {}

import { Module } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { BranchesController } from './branches.controller';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { ActivityModule } from '@/modules/activity/activity.module';

@Module({
  imports: [PrismaModule, ActivityModule],
  providers: [BranchesService],
  controllers: [BranchesController],
})
export class BranchesModule {}

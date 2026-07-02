import { Module } from '@nestjs/common';
import { CommitsService } from './commits.service';
import { CommitsController } from './commits.controller';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { ActivityModule } from '@/modules/activity/activity.module';

@Module({
  imports: [PrismaModule, ActivityModule],
  providers: [CommitsService],
  controllers: [CommitsController],
})
export class CommitsModule {}

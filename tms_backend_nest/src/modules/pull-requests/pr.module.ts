import { Module } from '@nestjs/common';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';
import { ActivityModule } from '@/modules/activity/activity.module';
import { PrController } from './pr.controller';
import { PrService } from './pr.service';

@Module({
  imports: [PrismaModule, ActivityModule],
  controllers: [PrController],
  providers: [PrService],
  exports: [PrService],
})
export class PrModule {}

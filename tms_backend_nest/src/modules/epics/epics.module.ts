import { Module } from '@nestjs/common';

import { PrismaModule } from '../../infrastructure/prisma/prisma.module';

import { EpicsController } from './epics.controller';
import { EpicsService } from './epics.service';

@Module({
  imports: [PrismaModule],
  controllers: [EpicsController],
  providers: [EpicsService],
  exports: [EpicsService],
})
export class EpicsModule {}

import { Module } from '@nestjs/common';
import { RequestAccessController } from './request-access.controller';
import { RequestAccessService } from './request-access.service';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RequestAccessController],
  providers: [RequestAccessService],
  exports: [RequestAccessService],
})
export class RequestAccessModule {}

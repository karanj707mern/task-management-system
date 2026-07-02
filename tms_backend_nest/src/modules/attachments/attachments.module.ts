import { Module } from '@nestjs/common';
import { AttachmentsController } from './attachments.controller';
import { AttachmentsService } from './attachments.service';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';
import { EventsModule } from '@/events/events.module';
import { MulterModule } from '@nestjs/platform-express';
import { multerConfig } from '@/config/multer.config';

@Module({
  imports: [PrismaModule, EventsModule, MulterModule.register(multerConfig)],
  controllers: [AttachmentsController],
  providers: [AttachmentsService],
  exports: [AttachmentsService],
})
export class AttachmentsModule {}

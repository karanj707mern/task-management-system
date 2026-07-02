import { Module } from '@nestjs/common';
import { CodeReviewsService } from './code-reviews.service';
import { CodeReviewsController } from './code-reviews.controller';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [CodeReviewsService],
  controllers: [CodeReviewsController],
})
export class CodeReviewsModule {}

import { Module } from '@nestjs/common';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { CommitsModule } from '@/modules/commits/commits.module';
import { PrModule } from '@/modules/pull-requests/pr.module';
import { CodeReviewsModule } from '@/modules/code-reviews/code-reviews.module';
import { GitHubController } from './github.controller';
import { GitHubIntegrationService } from './github.service';
import { GitHubApiService } from './octokit.service';
import { FailedWebhooksService } from './failed-webhooks.service';

@Module({
  imports: [PrismaModule, NotificationsModule, CommitsModule, PrModule, CodeReviewsModule],
  controllers: [GitHubController],
  providers: [GitHubIntegrationService, GitHubApiService, FailedWebhooksService],
  exports: [GitHubIntegrationService, GitHubApiService],
})
export class GitHubIntegrationModule {}
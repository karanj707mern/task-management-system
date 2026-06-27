import { Controller, Post, Headers, Body, UnauthorizedException, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { GetUser } from '@/common/decorators/get-user.decorator';
import { UserRole } from '@prisma/client';
import { GitHubIntegrationService } from './github.service';
import { FailedWebhooksService } from './failed-webhooks.service';

@Controller('integrations/github')
export class GitHubController {
  constructor(
    private readonly gitHubService: GitHubIntegrationService,
    private readonly failedWebhooksService: FailedWebhooksService,
  ) {}

  @Post('webhook')
  async handleWebhook(
    @Headers('x-github-event') event: string,
    @Headers('x-hub-signature-256') signature: string,
    @Body() payload: any,
  ) {
    if (!event) {
      throw new UnauthorizedException('Missing GitHub event header');
    }

    const repositoryId = payload?.repository?.id?.toString() || 'default';
    const rawPayload = JSON.stringify(payload);

    if (!this.gitHubService.verifySignature(rawPayload, signature)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    // Process event in a try/catch so we always return 200 to GitHub.
    // Failed payloads are persisted for manual replay.
    try {
      const result = await this.routeEvent(event, payload, repositoryId);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.failedWebhooksService.recordFailure(event, payload, message);
      // Return 200 so GitHub stops retrying; ops can replay from DB
      return { received: true, status: 'failed', error: message };
    }
  }

  private async routeEvent(event: string, payload: any, repositoryId: string) {
    switch (event) {
      case 'ping':
        return { received: true, message: 'pong' };
      case 'push':
        return this.gitHubService.handlePush(payload, repositoryId);
      case 'pull_request':
        return this.gitHubService.handlePullRequest(payload, repositoryId);
      case 'pull_request_review':
        return this.gitHubService.handlePRReview(payload, repositoryId);
      default:
        return { received: true, message: 'Event type not handled', event };
    }
  }

  @Post('auto-merge/:prId')
  @UseGuards(JwtAuthGuard)
  async autoMerge(
    @Param('prId') prId: string,
    @GetUser('userId') userId: string,
    @GetUser('role') role: UserRole,
  ) {
    return this.gitHubService.autoMergeEligiblePR(prId, userId, role);
  }
}
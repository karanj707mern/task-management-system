import { Injectable, Logger, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { GitHubApiService } from './octokit.service';
import { createHmac, timingSafeEqual } from 'crypto';
import { PRStatus, TaskStatus, ReviewStatus } from '@prisma/client';
import { GitHubPushPayload, GitHubPullRequestPayload, GitHubPRReviewPayload } from './github.constants';

const REVIEW_STATE_MAP: Record<string, ReviewStatus> = {
  APPROVED: ReviewStatus.APPROVED,
  CHANGES_REQUESTED: ReviewStatus.CHANGES_REQUESTED,
  COMMENTED: ReviewStatus.COMMENTED,
  DISMISSED: ReviewStatus.PENDING,
  PENDING: ReviewStatus.PENDING,
};

function mapReviewState(state: string): ReviewStatus {
  return REVIEW_STATE_MAP[state] || ReviewStatus.PENDING;
}

@Injectable()
export class GitHubIntegrationService {
  private readonly logger = new Logger(GitHubIntegrationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly gitHubApi: GitHubApiService,
  ) {}

  private getGitHubSecret(): string {
    return process.env.GITHUB_WEBHOOK_SECRET || '';
  }

  verifySignature(payload: string, signature: string): boolean {
    const secret = this.getGitHubSecret();
    if (!secret) {
      this.logger.warn('GITHUB_WEBHOOK_SECRET not set, skipping verification');
      return process.env.NODE_ENV !== 'production';
    }
    if (!signature) return false;
    const expected = `sha256=${createHmac('sha256', secret).update(payload).digest('hex')}`;
    try {
      return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    } catch {
      return false;
    }
  }

  async handlePush(payload: GitHubPushPayload, repositoryId: string) {
    this.logger.log(`Processing push event for ${payload.repository.full_name}`);

    const branchName = payload.ref.replace('refs/heads/', '');

    // Find project by GitHub repo ID
    const project = await this.prisma.project.findFirst({
      where: { githubRepoId: payload.repository.id.toString() },
    });

    if (!project) {
      this.logger.warn(`No project found for GitHub repo ${payload.repository.id}`);
      return { skipped: true, reason: 'Project not configured' };
    }

    // Find author: try githubLogin (from pusher.name or pusher.email), then fall back to email
    const author = await this.prisma.user.findFirst({
      where: {
        OR: [
          { githubLogin: payload.pusher.name },
          { email: payload.pusher.email },
        ],
      },
    });

    // Find existing branch
    const branch = await this.prisma.branch.findFirst({
      where: { name: branchName },
    });

    const branchId = branch?.id;

    if (!branchId) {
      this.logger.warn(`No branch found for ${branchName}, skipping commit creation`);
      return { processed: true, skipped: true, reason: 'Branch not found' };
    }

    // Create commits for each commit in the push
    for (const commit of payload.commits) {
      if (commit.id === payload.before) continue;

      await this.prisma.commit.upsert({
        where: { sha: commit.id },
        update: {},
        create: {
          sha: commit.id,
          message: commit.message,
          branchId,
          authorId: author?.id || '',
        },
      });
    }

    return { processed: true };
  }

  async handlePullRequest(payload: GitHubPullRequestPayload, repositoryId: string) {
    this.logger.log(`Processing PR event: ${payload.action} for PR #${payload.pull_request.number}`);

    const project = await this.prisma.project.findFirst({
      where: { githubRepoId: payload.repository.id.toString() },
    });

    if (!project) {
      this.logger.warn(`No project found for GitHub repo ${payload.repository.id}`);
      return { skipped: true, reason: 'Project not configured' };
    }

    // Find author: match by githubLogin first, then fall back to email
    let author = await this.prisma.user.findFirst({
      where: {
        OR: [
          { githubLogin: payload.pull_request.user.login },
          { email: payload.pull_request.user.email },
        ],
      },
    });

    if (!author) {
      this.logger.warn(`No user found for GitHub login ${payload.pull_request.user.login}, skipping PR creation`);
      return { skipped: true, reason: 'Author not found' };
    }

    // Find existing PR by GitHub ID
    const existingPR = await this.prisma.pullRequest.findFirst({
      where: { githubPrId: payload.pull_request.id.toString() },
    });

    // Find or create task for this PR
    let task = await this.prisma.task.findFirst({
      where: {
        pullRequests: {
          some: {
            githubPrId: payload.pull_request.id.toString(),
          },
        },
      },
    });

    if (!task) {
      task = await this.prisma.task.create({
        data: {
          title: payload.pull_request.title,
          description: payload.pull_request.body || '',
          status: TaskStatus.IN_PROGRESS,
          projectId: project.id,
          assigneeId: author?.id || '',
          createdById: author?.id || '',
          priority: 'MEDIUM',
        },
      });
    }

    const prStatus = payload.pull_request.merged ? PRStatus.MERGED : 
                     payload.action === 'closed' ? PRStatus.CLOSED : PRStatus.OPEN;

    if (!existingPR) {
      await this.prisma.pullRequest.create({
        data: {
          title: payload.pull_request.title,
          description: payload.pull_request.body || '',
          sourceBranch: payload.pull_request.head.ref,
          targetBranch: payload.pull_request.base.ref,
          status: prStatus,
          isDraft: (payload.pull_request as any).draft || false,
          authorId: author?.id || '',
          taskId: task.id,
          githubPrId: payload.pull_request.id.toString(),
          githubRepoId: payload.repository.id.toString(),
        },
      });
    } else {
      await this.prisma.pullRequest.update({
        where: { id: existingPR.id },
        data: {
          title: payload.pull_request.title,
          description: payload.pull_request.body || '',
          status: prStatus,
          isDraft: (payload.pull_request as any).draft || false,
          mergedAt: payload.pull_request.merged ? new Date() : undefined,
          mergedById: payload.pull_request.merged_by ? author?.id : undefined,
        },
      });
    }

    // Send notifications to project team members
    const projectMembers = await this.prisma.user.findMany({
      where: {
        isActive: true,
      },
    });

    for (const member of projectMembers) {
      await this.notificationsService.createNotification(member.id, {
        title: 'Pull Request Activity',
        message: `PR #${payload.pull_request.number} ${payload.action}: ${payload.pull_request.title}`,
        type: 'INFO',
      });
    }

    // Post a comment back to GitHub PR linking the TMS task (fire-and-forget)
    const ownerRepo = this.gitHubApi.getOwnerRepo(payload);
    if (ownerRepo && task) {
      const prNumber = payload.pull_request.number;
      const taskUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/tasks/${task.id}`;
      this.gitHubApi.createComment(
        ownerRepo.owner,
        ownerRepo.repo,
        prNumber,
        `📋 Task Management System\n` +
          `This PR is linked to task **${task.title}**.\n` +
          `View task: ${taskUrl}\n` +
          `Status: ${prStatus}`,
      ).catch(() => {
        // Non-blocking: comment failure shouldn't fail the webhook
      });
    }

    return { processed: true };
  }

  async handlePRReview(payload: GitHubPRReviewPayload, repositoryId: string) {
    this.logger.log(`Processing PR review: ${payload.action} for PR #${payload.pull_request.number}`);

    const pullRequest = await this.prisma.pullRequest.findFirst({
      where: { githubPrId: payload.pull_request.id.toString() },
    });

    if (!pullRequest) {
      return { skipped: true, reason: 'PR not found' };
    }

    const reviewer = await this.prisma.user.findFirst({
      where: {
        OR: [
          { githubLogin: payload.review.user.login },
          { email: payload.review.user.login },
        ],
      },
    });

    // Create or update code review
    await this.prisma.codeReview.upsert({
      where: {
        prId_reviewerId: {
          prId: pullRequest.id,
          reviewerId: reviewer?.id || pullRequest.authorId,
        },
      },
      update: {
        status: mapReviewState(payload.review.state),
        comments: payload.review.body,
      },
      create: {
        prId: pullRequest.id,
        reviewerId: reviewer?.id || pullRequest.authorId,
        status: mapReviewState(payload.review.state),
        comments: payload.review.body,
      },
    });

    return { processed: true };
  }

  async autoMergeEligiblePR(prId: string, userId: string, role: string) {
    // Check if user is admin or maintainer
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && role !== 'MANAGER') {
      throw new ForbiddenException('Only managers and administrators can merge PRs');
    }

    const pullRequest = await this.prisma.pullRequest.findUnique({
      where: { id: prId },
      include: {
        reviews: true,
        task: true,
      },
    });

    if (!pullRequest) {
      throw new NotFoundException('PR not found');
    }

    // Check if all required reviews are approved
    if (pullRequest.reviews.length === 0) {
      throw new ForbiddenException('At least one review is required before merging');
    }

    const allReviewsApproved = pullRequest.reviews.every(
      (review) => review.status === ReviewStatus.APPROVED,
    );

    if (!allReviewsApproved) {
      throw new ForbiddenException('All reviews must be approved before merging');
    }

    // Update PR status
    await this.prisma.pullRequest.update({
      where: { id: prId },
      data: {
        status: PRStatus.MERGED,
        mergedAt: new Date(),
        mergedById: userId,
      },
    });

    // Update task status to DONE
    if (pullRequest.taskId) {
      await this.prisma.task.update({
        where: { id: pullRequest.taskId },
        data: { status: TaskStatus.DONE },
      });
    }

    // Send notifications
    await this.notificationsService.createNotification(pullRequest.authorId, {
      title: 'Pull Request Merged',
      message: `Your PR has been automatically merged: ${pullRequest.title}`,
      type: 'SUCCESS',
    });

    return { merged: true };
  }
}
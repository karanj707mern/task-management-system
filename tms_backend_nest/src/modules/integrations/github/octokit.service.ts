import { Injectable, Logger } from '@nestjs/common';
import { Octokit } from '@octokit/rest';

@Injectable()
export class GitHubApiService {
  private readonly logger = new Logger(GitHubApiService.name);
  private octokit: Octokit | null = null;

  private getClient(): Octokit {
    if (!this.octokit) {
      const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
      if (!token) {
        throw new Error('GITHUB_PERSONAL_ACCESS_TOKEN is not set in environment');
      }
      this.octokit = new Octokit({
        auth: token,
      });
    }
    return this.octokit;
  }

  /**
   * Parse "owner/repo" from a GitHub webhook payload's repository.full_name
   */
  getOwnerRepo(payload: { repository?: { full_name?: string } }): { owner: string; repo: string } | null {
    if (!payload.repository?.full_name) {
      return null;
    }
    const [owner, repo] = payload.repository.full_name.split('/');
    if (!owner || !repo) {
      return null;
    }
    return { owner, repo };
  }

  /**
   * Post a comment to a GitHub issue or PR
   */
  async createComment(owner: string, repo: string, issueNumber: number, body: string) {
    try {
      const response = await this.getClient().rest.issues.createComment({
        owner,
        repo,
        issue_number: issueNumber,
        body,
      });
      return response.data;
    } catch (error) {
      this.logger.warn(`Failed to create GitHub comment on ${owner}/${repo}#${issueNumber}: ${error}`);
      return null;
    }
  }

  /**
   * Create or update a commit status (GitHub Checks API)
   */
  async createCommitStatus(
    owner: string,
    repo: string,
    sha: string,
    state: 'pending' | 'success' | 'failure' | 'error',
    description: string,
    context: string,
    targetUrl?: string,
  ) {
    try {
      const response = await this.getClient().rest.repos.createCommitStatus({
        owner,
        repo,
        sha,
        state,
        description,
        context,
        target_url: targetUrl,
      });
      return response.data;
    } catch (error) {
      this.logger.warn(`Failed to create commit status for ${owner}/${repo}@${sha}: ${error}`);
      return null;
    }
  }

  /**
   * Get PR details from GitHub API
   */
  async getPullRequest(owner: string, repo: string, prNumber: number) {
    try {
      const response = await this.getClient().rest.pulls.get({
        owner,
        repo,
        pull_number: prNumber,
      });
      return response.data;
    } catch (error) {
      this.logger.warn(`Failed to fetch PR ${owner}/${repo}#${prNumber}: ${error}`);
      return null;
    }
  }

  /**
   * Get commit details from GitHub API
   */
  async getCommit(owner: string, repo: string, sha: string) {
    try {
      const response = await this.getClient().rest.repos.getCommit({
        owner,
        repo,
        ref: sha,
      });
      return response.data;
    } catch (error) {
      this.logger.warn(`Failed to fetch commit ${owner}/${repo}@${sha}: ${error}`);
      return null;
    }
  }
}

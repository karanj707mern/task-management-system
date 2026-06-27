export const GITHUB_EVENTS = {
  PUSH: 'push',
  PULL_REQUEST: 'pull_request',
  PULL_REQUEST_REVIEW: 'pull_request_review',
  PULL_REQUEST_SYNCHRONIZE: 'pull_request_synchronize',
} as const;

export const PR_ACTION = {
  OPENED: 'opened',
  REOPENED: 'reopened',
  CLOSED: 'closed',
  SYNCHRONIZED: 'synchronize',
} as const;

export interface GitHubPushPayload {
  ref: string;
  before: string;
  after: string;
  repository: {
    id: number;
    name: string;
    full_name: string;
    html_url: string;
  };
  pusher: {
    name: string;
    email: string;
  };
  commits: Array<{
    id: string;
    message: string;
    timestamp: string;
    author: {
      name: string;
      email: string;
    };
    url: string;
  }>;
}

export interface GitHubPullRequestPayload {
  action: string;
  pull_request: {
    id: number;
    number: number;
    title: string;
    body: string;
    state: string;
    merged: boolean;
    merge_commit_sha?: string;
    head: {
      ref: string;
      sha: string;
    };
    base: {
      ref: string;
      sha: string;
    };
    user: {
      login: string;
      id: number;
      avatar_url: string;
      html_url: string;
      email?: string;
    };
    requested_reviewers: Array<{
      login: string;
      id: number;
    }>;
    merged_by?: {
      login: string;
      id: number;
    };
  };
  repository: {
    id: number;
    name: string;
    full_name: string;
    html_url: string;
  };
  sender: {
    login: string;
    id: number;
  };
}

export interface GitHubPRReviewPayload {
  action: 'created' | 'edited' | 'dismissed';
  review: {
    id: number;
    body: string;
    state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'DISMISSED';
    user: {
      login: string;
      id: number;
    };
  };
  pull_request: {
    id: number;
    number: number;
    title: string;
    head: {
      ref: string;
      sha: string;
    };
  };
  repository: {
    id: number;
    name: string;
    full_name: string;
  };
}
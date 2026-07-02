-- Add missing Jira/GitHub tracking columns to Task
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "externalId" TEXT;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "externalKey" TEXT;

-- Add GitHub repo tracking columns to Project
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "githubRepoId" TEXT;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "githubRepoUrl" TEXT;

-- Add GitHub PR tracking columns to PullRequest
ALTER TABLE "PullRequest" ADD COLUMN IF NOT EXISTS "githubPrId" TEXT;
ALTER TABLE "PullRequest" ADD COLUMN IF NOT EXISTS "githubRepoId" TEXT;
ALTER TABLE "PullRequest" ADD COLUMN IF NOT EXISTS "isDraft" BOOLEAN NOT NULL DEFAULT false;

-- Add index on PullRequest.githubPrId for lookups
CREATE UNIQUE INDEX IF NOT EXISTS "PullRequest_githubPrId_key" ON "PullRequest"("githubPrId");

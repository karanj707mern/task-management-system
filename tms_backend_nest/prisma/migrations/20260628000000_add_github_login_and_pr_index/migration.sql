-- Add githubLogin field to User model
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "githubLogin" TEXT;

-- Create unique index for githubLogin (allow nulls, only unique among non-nulls)
CREATE UNIQUE INDEX IF NOT EXISTS "User_githubLogin_key" ON "User"("githubLogin");

-- Add index on Commit.prId for faster PR-scoped commit queries
CREATE INDEX IF NOT EXISTS "Commit_prId_idx" ON "Commit"("prId");

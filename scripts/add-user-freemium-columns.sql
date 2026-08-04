-- Add freemium / nurture columns missing from production after PR #20.
-- Safe to re-run: IF NOT EXISTS guards.
--
-- Apply with:
--   npx prisma db execute --file scripts/add-user-freemium-columns.sql --schema prisma/schema.prisma
-- Or:
--   npx prisma db push

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "freeChatUsed" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "nurtureEmailStep" INTEGER NOT NULL DEFAULT 0;

# Ongoing ops checklist

## Neon (Postgres)

- Confirm compute autosuspend is enabled on non-prod branches.
- After running `scripts/backfill-gaceta-pdf-to-blob.ts`, verify `pdfData` is null for all rows, then drop the column in a follow-up migration.
- Before cancelling EdgeStore, migrate leftover avatars with `scripts/migrate-edgestore-avatars-to-blob.ts`, then confirm `SELECT COUNT(*) FROM "User" WHERE image LIKE '%edgestore%';` is `0`.
- Monitor storage growth from article content + pgvector embeddings.

## Vercel

- Review Fluid Compute routes with `maxDuration = 300` (Gaceta processing, embeddings batch).
- Blob storage: confirm Gaceta deletes call `del()` (implemented in `deleteGaceta`).

## Anthropic (largest variable cost)

- Monthly: total Sonnet input/output tokens per Gaceta processed.
- Current caps: `MAX_CHARS = 500_000`, Gaceta `max_tokens = 16_000`, legal-update generation `max_tokens = 12_000`.
- Tighten caps if average Gaceta size is well below the ceiling.

## Article AI summaries

- Field: `Article.aiSummary` (Haiku via Anthropic Message Batches).
- Daily cron `0 2 * * *` → `GET /api/ai/generate-summaries` drains pending `BatchJob`s then creates the next chunk (default 1000).
- Manual backfill: `npx tsx --env-file=.env.local scripts/backfill-ai-summaries.ts`
- Articles with empty `contentPlainText` are skipped until content is fixed.
- Requires `ANTHROPIC_API_KEY` and `CRON_SECRET`.

## OpenAI embeddings

- Query embeddings are cached in-memory for 5 minutes (`src/lib/embeddings.ts`).
- If chat traffic grows, consider Vercel KV for cross-instance cache.

## Vendors cancelled

- EdgeStore — static assets in `/public/site`, uploads on Vercel Blob.
- Vercel Analytics / Speed Insights — GA only.

## Billing (Paddle)

- Monthly Personal: `NEXT_PUBLIC_PRICE_ID` ($5.99/mo).
- Annual Personal: `NEXT_PUBLIC_ANNUAL_PRICE_ID` ($35.94/yr = half of 12× monthly). Create the annual price in Paddle Billing and set the env on Vercel.
- After schema changes (`freeChatUsed`, `nurtureEmailStep`), run `npx prisma db push` against Neon.
- Nurture drip cron: `GET /api/nurture/drip` daily at 14:00 UTC (requires `CRON_SECRET` / Vercel cron).

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

## OpenAI embeddings

- Query embeddings are cached in-memory for 5 minutes (`src/lib/embeddings.ts`).
- If chat traffic grows, consider Vercel KV for cross-instance cache.

## Vendors cancelled

- EdgeStore — static assets in `/public/site`, uploads on Vercel Blob.
- Vercel Analytics / Speed Insights — GA only.

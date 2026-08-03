# Biblioteca Legal

Virtual Honduran law library: searchable statutes, document reader, highlights, subscriptions, Gaceta pipeline, and Legal AI chat.

Live: [bibliotecalegalhn.com](https://bibliotecalegalhn.com)

## Stack

- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS
- **Backend**: Next.js Route Handlers + Server Actions
- **Database**: PostgreSQL (Neon) via Prisma + pgvector
- **Hosting**: Vercel
- **Storage**: `/public` static assets + Vercel Blob (PDFs, avatars)
- **Auth**: NextAuth v5 (credentials + JWT)
- **Payments**: Paddle
- **Email**: Resend
- **AI**: Anthropic (Gaceta extraction), OpenAI (embeddings), Groq (chat)
- **Analytics**: Google Analytics

## Getting started

```bash
cp .env.example .env.local
# fill in DATABASE_URL, AUTH_SECRET, API keys, etc.
npm install
npm run dev
```

Schema changes use explicit migrations — `postinstall` only runs `prisma generate`.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run validate` | Prisma schema validate |
| `npx tsx scripts/backfill-gaceta-pdf-to-blob.ts` | One-time legacy pdfData → Blob migration |

## Deployment

Deploy on Vercel. Required env vars are listed in `.env.example`. Cron job (`vercel.json`) runs nightly article summaries at 02:00 UTC.

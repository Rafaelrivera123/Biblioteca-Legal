# Biblioteca Legal

Legal research platform for Honduras — Next.js 14, Prisma, NextAuth v5.

## Setup

1. Copy environment variables:

```bash
cp .env.example .env.local
```

2. Install dependencies:

```bash
npm install
```

3. Configure required variables in `.env.local`:

- `DATABASE_URL` — Neon Postgres connection string
- `AUTH_SECRET` — random string for session signing
- `AUTH_URL` — public app URL (e.g. `https://bibliotecalegalhn.com`)
- `SUPERSENDTX_API_KEY` — SuperSend TX API key (`stx_…`) for transactional auth email

Optional:

- `SUPERSENDTX_DOMAIN_VERIFIED=true` — enable production `from`/`to` after `bibliotecalegalhn.com` is verified in SuperSend TX. Until then, auth emails are sent via the SuperSend TX sandbox (`noreply@mail.supersendtx.com` → `soporte@bibliotecalegalhn.com`).
- OAuth: `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`, `AUTH_FACEBOOK_ID` / `AUTH_FACEBOOK_SECRET`

4. Run the database and dev server:

```bash
npx prisma migrate deploy
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run email` | Preview React Email templates |

## Transactional email

Auth-related email (verification, magic-link sign-in, password reset OTP) is sent server-side via SuperSend TX (`src/lib/supersendtx.ts`). The API key must never be exposed to the client bundle.

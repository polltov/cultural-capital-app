# Cultural Capital

Booking system for family excursions in Saint Petersburg. Guests browse tours, pick a fixed date slot, adjust adult/child counters, and submit contact info. Admin confirms orders manually via the panel; Telegram bot pushes new-order notifications.

## Stack

- Next.js 16 (App Router, Turbopack, Server Actions)
- Neon Postgres + Drizzle ORM
- Tailwind v4
- Vercel Blob for tour photos
- Telegram Bot API for admin push
- Vitest (unit + integration against Neon) and Playwright (E2E)

## Development

```bash
npm install
cp .env.example .env.local   # fill DATABASE_URL, SESSION_SECRET, etc.
npm run db:migrate
npm run db:seed              # optional demo tour + slot
npm run dev
```

Bootstrap the first admin:

```bash
npm run admin:create
```

## Scripts

- `npm run dev` — Next dev server (Turbopack)
- `npm run build` / `npm start` — production build
- `npm run lint` / `npm run typecheck` — ESLint / tsc
- `npm test` — Vitest unit + integration (integration hits Neon, serialized)
- `npm run test:e2e` — Playwright happy path
- `npm run db:migrate` — apply Drizzle migrations
- `npm run admin:create` — CLI to bootstrap the first admin

## Environment

See `.env.example`. Required in prod:

- `DATABASE_URL` — Neon pooled URL
- `SESSION_SECRET` — random 32-byte hex
- `PUBLIC_BASE_URL` — e.g. `https://cultural-capital-app.vercel.app`
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_ID` — admin notifications

## Docs

- Design spec: `docs/superpowers/specs/2026-07-22-cultural-capital-user-flow-design.md`
- Implementation plan: `docs/superpowers/plans/2026-07-22-cultural-capital-user-flow.md`

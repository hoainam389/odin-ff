# ODIN Champion League

Next.js 15 + Tailwind + Drizzle + Supabase implementation of the ODIN internal FIFA tournament tracker. See [requirement.md](requirement.md) for full scope.

## Setup

```bash
pnpm install        # or npm install / yarn

# 1. Fill .env from .env.example (copy or use Vercel-Supabase Marketplace integration)
cp .env.example .env

# 2. Push schema to Supabase
pnpm db:push

# 3. Seed teams + 21 fixtures
pnpm db:seed

# 4. Run dev server
pnpm dev
```

Admin login: `/login` with `ADMIN_USERNAME` / `ADMIN_PASSWORD` from env.

## Realtime

Public pages subscribe to Postgres changes on the `results` table via Supabase Realtime; they call `router.refresh()` on any insert/update/delete so the standings update without a manual reload.

## Design

The chosen UI lives as static HTML reference in [design/](design/). The Next.js app reuses the same design tokens via [tailwind.config.ts](tailwind.config.ts).

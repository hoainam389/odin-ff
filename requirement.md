# ODIN Champion League — Requirement

## 1. Context

We have a working static prototype of an internal FIFA tournament tracker at
[ODIN FIFA 2026 - Pro Manager_v6.html](ODIN%20FIFA%202026%20-%20Pro%20Manager_v6.html)
(1,173 lines, all state held in `localStorage`). A teammate built it.

The goal is to:
1. Redesign the UI in a football-championship style using Stitch MCP (two variants for selection).
2. Convert the chosen design into a Next.js app backed by a real database.
3. Deploy to Vercel.
4. Preserve **every existing feature 1:1**, but split capabilities by role.

The build will be driven through the **gsd** workflow, so this document is the
single source of truth for scope, stack, and acceptance criteria.

---

## 2. Roles

| Role | Capabilities |
|---|---|
| **admin** (single user) | Full CRUD on teams, members, schedule, results, cards. Drag-and-drop reschedule. Auto-schedule. |
| **anonymous** (everyone else) | Read-only: fixtures, results, standings, stats, podium, fairplay. No login required. Sees live updates without refresh. |

### Auth
- **Single hardcoded admin** with credentials seeded from env vars:
  - `ADMIN_USERNAME=admin`
  - `ADMIN_PASSWORD=niteco123`
- No signup, no password reset, no multi-user.
- Implementation: a `/login` page that checks env vars, sets an HttpOnly signed session cookie. Middleware (`middleware.ts`) gates `/admin/*` routes.
- No NextAuth needed — keep it minimal (iron-session or a hand-rolled JWT cookie).

---

## 3. Tech Stack (locked)

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 15 (App Router)** | Vercel-native, RSC for read pages, server actions for admin writes. |
| Hosting | **Vercel** | Required. |
| Database | **Supabase Postgres** | Single-vendor solution. Official Vercel Marketplace integration auto-injects env vars. Free tier (500 MB DB, 2 GB egress) covers the workload. |
| ORM | **Drizzle** | Lightweight, TypeScript-first, plays well with Supabase's pooled connection string (port 6543). |
| Realtime | **Supabase Realtime (`postgres_changes`)** | Built-in. No extra broker (Pusher/Ably) needed. Anonymous clients subscribe with the anon key. |
| UI library | Stitch-generated HTML → **React + Tailwind CSS** | Stitch is the design tool; output is converted via the `react-components` skill. |
| Language | **TypeScript everywhere** | Non-negotiable. |
| Locale | **English UI** | Replace all Vietnamese strings (`Thứ Hai`, `Hôm nay`, etc.) with English. |

### Env vars
```
# Supabase (auto-injected by Vercel Marketplace)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
DATABASE_URL=...           # pooled (6543) — for Drizzle in serverless
DIRECT_URL=...             # direct (5432) — for drizzle-kit migrations

# Admin auth
ADMIN_USERNAME=admin
ADMIN_PASSWORD=niteco123
SESSION_SECRET=...         # 32+ random bytes for cookie signing
```

---

## 4. Design Phase (Stitch MCP)

Before any Next.js code is written:

1. Use Stitch MCP (`stitch-design` skill) to generate **two whole-app design variants** in a football-championship aesthetic (premier-league inspired — green pitch tones, gold accents for podium, clear ranking hierarchy).
2. Output both as static HTML into:
   - `/design/v1/` — variant A
   - `/design/v2/` — variant B
3. Each variant must cover **all screens** (see §5).
4. Share a single Stitch design system across both variants so converting to Tailwind tokens later is mechanical.
5. User picks one variant; the other is archived but kept in the repo for reference.

---

## 5. Screens (parity with the existing HTML)

All of these exist in the prototype and must be present in both Stitch variants and the final Next.js app:

| Screen | Path (final app) | Audience | Notes |
|---|---|---|---|
| Standings + podium + stats summary | `/` | Public | Live-updates on result entry. EPL-style ranking (3 pts win / 1 draw / 0 loss; tiebreak GD → GF). Podium for top 3. |
| Fixtures / matchday schedule | `/fixtures` | Public read, admin edits inline | Calendar tiles, "Today" / "Past" badges, per-day match grouping. |
| Match result detail (read-only modal/page) | `/matches/[id]` | Public | Score + yellow/red cards. |
| Login | `/login` | Public | Admin only; redirects to `/admin`. |
| Admin dashboard | `/admin` | Admin | Entry point with shortcuts to all admin actions. |
| Admin: teams & members | `/admin/teams` | Admin | Edit name, emoji, color, member list per team. |
| Admin: schedule editor | `/admin/schedule` | Admin | Drag-and-drop reschedule across days, auto-schedule button (3 matches/workday, skip weekends). |
| Admin: enter result | `/admin/matches/[id]` | Admin | Score + cards (yellow/red per side). |

---

## 6. Domain Model (canonical — replaces `localStorage`)

Mirrors the prototype's state shape (`teams`, `members`, `teamEmojis`, `teamColors`, `results`, `matchDates`, `scheduleOrder`).

### Tables

```sql
-- 7 teams, fixed for the season
teams (
  id          text PRIMARY KEY,         -- 'A'..'G'
  name        text NOT NULL,            -- 'Team Alpha'
  emoji       text NOT NULL,            -- single emoji char
  color       text NOT NULL,            -- hex
  display_order int NOT NULL
)

members (
  id          serial PRIMARY KEY,
  team_id     text REFERENCES teams(id) ON DELETE CASCADE,
  name        text NOT NULL
)

-- Round-robin: 7 teams × 6 opponents / 2 = 21 matches
matches (
  id          serial PRIMARY KEY,
  home_team   text REFERENCES teams(id),
  away_team   text REFERENCES teams(id),
  match_date  date NOT NULL,            -- editable by admin (DnD)
  display_order int NOT NULL,           -- for within-day ordering
  created_at  timestamptz DEFAULT now()
)

results (
  match_id    int PRIMARY KEY REFERENCES matches(id) ON DELETE CASCADE,
  score_home  int NOT NULL,
  score_away  int NOT NULL,
  yellow_home int NOT NULL DEFAULT 0,
  yellow_away int NOT NULL DEFAULT 0,
  red_home    int NOT NULL DEFAULT 0,
  red_away    int NOT NULL DEFAULT 0,
  updated_at  timestamptz DEFAULT now()
)
```

### Derived (computed in queries, not stored)
- **Standings**: aggregate from `results` joined with `matches`. EPL ranking rules — sort by `points DESC, (gf-ga) DESC, gf DESC`.
- **Stats**: total played, total goals, total yellows, total reds.
- **Fairplay**: team with lowest `yellow*1 + red*3` among teams that have played ≥ 1 match.

### Realtime channel
Single channel listening to `postgres_changes` on the `results` table (`INSERT` + `UPDATE` + `DELETE`). Public pages subscribe and call `router.refresh()` on any event.

### Seed data
Fresh start. Seed script creates:
- 7 teams (A–G) with default names, emojis, colors matching the prototype defaults at [ODIN FIFA 2026 - Pro Manager_v6.html:589-592](ODIN%20FIFA%202026%20-%20Pro%20Manager_v6.html#L589-L592).
- 21 fixtures (full round-robin), 3 per workday starting 2026-05-18, skipping weekends.
- No results yet.

---

## 7. Business Logic (port from the prototype)

These functions in the existing HTML are the canonical spec — port their behavior verbatim into TypeScript:

| Concern | Reference in prototype |
|---|---|
| Standings calculation (points, W/D/L, GF/GA) | [ODIN FIFA 2026 - Pro Manager_v6.html:879-895](ODIN%20FIFA%202026%20-%20Pro%20Manager_v6.html#L879-L895) |
| Fairplay calc | [ODIN FIFA 2026 - Pro Manager_v6.html:867-873](ODIN%20FIFA%202026%20-%20Pro%20Manager_v6.html#L867-L873) |
| Auto-schedule (3 per workday, skip weekends, completed keep date) | [ODIN FIFA 2026 - Pro Manager_v6.html:630-667](ODIN%20FIFA%202026%20-%20Pro%20Manager_v6.html#L630-L667) |
| Default date generation | [ODIN FIFA 2026 - Pro Manager_v6.html:571-586](ODIN%20FIFA%202026%20-%20Pro%20Manager_v6.html#L571-L586) |
| Drag-and-drop reschedule | [ODIN FIFA 2026 - Pro Manager_v6.html:687-741](ODIN%20FIFA%202026%20-%20Pro%20Manager_v6.html#L687-L741) |
| Matchday grouping (today / past / future badges) | [ODIN FIFA 2026 - Pro Manager_v6.html:746-783](ODIN%20FIFA%202026%20-%20Pro%20Manager_v6.html#L746-L783) |

---

## 8. Out of Scope

- Multiple admins or user accounts.
- Player-level stats (goals/assists per player).
- Knockout / playoff brackets — round-robin only.
- Migrating any existing `localStorage` data (starting fresh).
- Mobile apps. Responsive web only.

---

## 9. Acceptance Criteria

1. `/design/v1/` and `/design/v2/` each contain a full set of static HTML screens covering everything in §5.
2. After the user picks a variant, the Next.js app:
   - Renders all public screens with seed data.
   - Lets admin log in at `/login` with `admin` / `niteco123`.
   - Lets admin create/update results, edit teams, reschedule matches.
   - Updates the public standings page **without a refresh** within 2 seconds of an admin save.
   - Computes standings identically to the prototype (verified against the formulas in §7).
3. Deployed to Vercel from `main`, environment variables set via the Supabase Marketplace integration.
4. Lighthouse mobile performance ≥ 85 on the standings page.
5. UI strings are English-only. No Vietnamese leakage.

---

## 10. Build Order (suggested gsd milestones)

1. **M1 — Design exploration**: generate `/design/v1/` and `/design/v2/` via Stitch. User picks one.
2. **M2 — Scaffold**: Next.js 15 + Tailwind + Drizzle + Supabase wired. Empty schema deployed.
3. **M3 — Domain & seed**: schema, migrations, seed script. Drizzle queries for standings/stats.
4. **M4 — Public pages**: standings, fixtures, match detail. No auth, no writes.
5. **M5 — Admin auth & layout**: `/login`, middleware, session cookie, admin shell.
6. **M6 — Admin write flows**: enter result, edit teams, schedule editor (incl. drag-and-drop + auto-schedule).
7. **M7 — Realtime**: Supabase `postgres_changes` subscription on public pages. End-to-end test: admin save → public page updates within 2s.
8. **M8 — Deploy**: Vercel + Supabase Marketplace integration, smoke test on prod URL.

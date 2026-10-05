# AegisWatch — Frontend

Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS, styled against the Stitch **Orbital Telemetry & Crisis Operations** design system.

## What this is

The client half of AegisWatch. It renders the tactical mission-control dashboard (map, KPI banner, incident list, header, sidebar, modals) and talks to **Supabase** for auth, the notification workflow database, and Realtime. There is no separate application server.

## Stack

- Next.js 16.3.4 (App Router, Turbopack in dev)
- React 19 + TypeScript (`strict`)
- Tailwind CSS with the Stitch tactical tokens
- Leaflet + ESRI World Dark Gray Canvas basemap
- `@supabase/ssr` browser + server clients
- Lucide React + Material Symbols Outlined icons

## Local setup

1. From the repo root, copy `frontend/.env.example` to `frontend/.env` (the real `.env` is git-ignored).
2. Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from your Supabase project's API settings.
3. Apply the schema: open [supabase/schema.sql](../supabase/schema.sql) in your project's SQL Editor and run it. If signup is broken, also run [supabase/fix-signup.sql](../supabase/fix-signup.sql).
4. `cd frontend && npm install && npm run dev`
5. Open [http://localhost:3000](http://localhost:3000).

## Key files

- `src/app/page.tsx` — dashboard hub
- `src/app/settings/page.tsx` — settings shell (client: `SettingsClient.tsx`)
- `src/app/api/tsunami/route.ts` — NOAA/NWS tsunami feed proxy (no CORS otherwise)
- `src/components/` — AuthModal, ProfileModal, SettingsClient, Header, Sidebar, TacticalMap, IncidentList, modals, etc.
- `src/lib/supabase.ts` — single canonical browser Supabase client (`@supabase/ssr` `createBrowserClient`, cached)
- `src/utils/supabase/server.ts` — server client for SSR/route handlers
- `src/proxy.ts` — App Router middleware: session refresh + `/settings` protection
- `src/services/disasterService.ts` — live feed adapters (USGS, NASA EONET, GDACS, tsunami proxy, ReliefWeb) + aggregation + India focus + counts
- `src/lib/preferences.ts` — `user_profiles` + `alert_preferences` data layer
- `src/lib/notifications.ts` — notifications read + mark-read + Realtime subscribe

## Environment

The frontend `.env` (git-ignored) needs:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

The repo root also has a local `.env` used for applying schema / running one-off Supabase operations; it needs `SUPABASE_SERVICE_ROLE_KEY`.

## Notes for presenters

- **Signup works.** If it doesn't, the trigger is the usual culprit — run [supabase/fix-signup.sql](../supabase/fix-signup.sql) in the Supabase SQL Editor.
- **There are no static/simulated incidents.** Every marker comes from a live feed. If the India panel is empty, that's the honest live state, not a bug.
- **Avatars are URL-based today** (paste a URL on signup, or get one from Google). File upload is a later phase.
- **No AI guidance is wired yet.** Incident advisory text and the emergency disclaimer are deterministic. See the reconciliation note in [docs/PRD.md](../docs/PRD.md).

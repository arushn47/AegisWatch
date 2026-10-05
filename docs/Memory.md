# AegisWatch — Active Session Memory & Progress State

**Project:** AegisWatch (Capstone Phase-1)
**Last Updated:** 2026-10-03 (signup fixed + avatar capture + India live coverage + static incidents removed)
**Active Phase:** Phase 1 — Tactical Radar + Supabase Auth + DB-backed notifications (working state)
**Frontend Framework:** Next.js 16.3.4 (App Router) + React 19 + TypeScript + Tailwind CSS
**Backend:** Supabase (Auth + PostgreSQL workflow tables + Realtime + Storage-ready). **No Java/Spring Boot server.**
**Current Status:** Next.js App Router is live at `http://localhost:3000` with 100% real-time USGS + NASA EONET + GDACS + NOAA tsunami telemetry (no static fixtures), Supabase auth (email + Google) working, DB-backed notification center streaming over Realtime, avatar capture in signup/profile/settings, and honest India region coverage.

---

## 1. Documentation Index & Baseline
- **[PRD.md](file:///d:/CODING/Project%20Exhibition/Capstone%20Phase-1/DisasterWatch/docs/PRD.md)**: Product Requirements Document (vision/personas/goals). **Read the §8 reconciliation note** — the original PRD describes a Spring Boot backend; the live runtime is Supabase.
- **[Architecture.md](file:///d:/CODING/Project%20Exhibition/Capstone%20Phase-1/DisasterWatch/docs/Architecture.md)**: **Rewritten** to the real architecture (Next.js + Supabase). The old Spring Boot + PostGIS + Redis + Gemini architecture is obsolete.
- **[Rules.md](file:///d:/CODING/Project%20Exhibition/Capstone%20Phase-1/DisasterWatch/docs/Rules.md)**: Development & AI safety guardrails, updated to the real stack. Deterministic-risk and mandatory-disclaimer axioms still hold.
- **[Phases.md](file:///d:/CODING/Project%20Exhibition/Capstone%20Phase-1/DisasterWatch/docs/Phases.md)**: **Rewritten** roadmap around the actual Supabase-backed delivery path.
- **[Design.md](file:///d:/CODING/Project%20Exhibition/Capstone%20Phase-1/DisasterWatch/docs/Design.md)**: Tactical Brutalism & Mission Control Dark Mode tokens (still accurate — unchanged).
- **[STATUS.md](file:///d:/CODING/Project%20Exhibition/Capstone%20Phase-1/DisasterWatch/docs/STATUS.md)**: Current system deliverables & talking points (**rewritten** to current state).
- **[.env.example](file:///d:/CODING/Project%20Exhibition/Capstone%20Phase-1/DisasterWatch/.env.example)**: Supabase env var blueprint.
- **[supabase/schema.sql](file:///d:/CODING/Project%20Exhibition/Capstone%20Phase-1/DisasterWatch/supabase/schema.sql)**: Idempotent Supabase schema (workflow tables, RLS, triggers, ingest RPC, grants, Realtime publication).
- **[supabase/fix-signup.sql](file:///d:/CODING/Project%20Exhibition/Capstone%20Phase-1/DisasterWatch/supabase/fix-signup.sql)**: The signup-recovery trigger fix.

---

## 2. Active Implementation State

### Completed Features:
1. **Next.js 16 App Router frontend** (`src/app/`):
   - `src/app/page.tsx` — dashboard hub (map, KPI banner, incident list, header, sidebar, modals).
   - `src/app/settings/page.tsx` — settings shell, rendered client-side via `SettingsClient.tsx`.
   - `src/app/reset-password/page.tsx` — password reset confirmation screen.
   - `src/app/api/tsunami/route.ts` — server-side proxy for the NOAA/NWS tsunami Atom feeds (no CORS otherwise).
2. **Tactical Mission Control Layout (Exact Stitch Parity)**:
   - Header (`Header.tsx`) with operational status indicators, notification bell + unread count, settings trigger, and user avatar badge (image when `avatar_url` is set, otherwise initials fallback).
   - Sidebar (`Sidebar.tsx`) with domain filters and region switcher (Global / South Asia · India).
   - KPI banner, incident list, incident detail modal, nearby alerts modal, recent alerts modal, notification center modal, emergency disclaimer, PWA status widget, relay status footer.
3. **Interactive Global Radar Map** (`TacticalMap.tsx`):
   - ESRI World Dark Gray Canvas basemap (zero watermark, zero keys).
   - Pulsing beacon markers color-coded by hazard domain + severity.
   - Click-to-pan to incident coordinates.
4. **Live Multi-Hazard Telemetry Stream (real feeds only, no static fixtures):**
   - **USGS** — global earthquakes (M2.5+, past 24h) + Indian subcontinent / Himalayan belt significant quakes (M4.5+, past 7 days).
   - **NASA EONET** — open natural events (wildfires, storms, floods, volcanoes, landslides, temperature extremes, drought, snow).
   - **GDACS** (UN/EC) — tropical cyclones, floods, droughts with alert levels + affected countries. **Primary India coverage source.**
   - **NOAA/NWS tsunami advisories** — NTWC Palmer + PTWC Honolulu, proxied through `/api/tsunami`, parsed with DOMParser. Only Warning/Advisory/Watch emitted.
   - **ReliefWeb (UN OCHA)** — opt-in, requires approved `NEXT_PUBLIC_RELIEFWEB_APPNAME`.
5. **Supabase Auth** (`src/lib/supabase.ts` + `src/utils/supabase/`):
   - Single canonical browser client (`@supabase/ssr` `createBrowserClient`, cached).
   - Server client in `src/utils/supabase/server.ts`.
   - `src/proxy.ts` (renamed from `middleware.ts`) refreshes session on every request + protects `/settings`.
   - Email signup, email login, Google OAuth, password reset.
6. **Signup trigger fix** (`supabase/fix-signup.sql`):
   - Replaced `fn_handle_new_user()` (which used `ON CONFLICT (id) DO UPDATE` against a `user_profiles` table without a unique index on `id`, aborting every signup) with a version using `ON CONFLICT DO NOTHING` + per-insert `BEGIN … EXCEPTION` blocks so a profile/preference failure never rolls back auth.
7. **Database-backed notification center + Realtime:**
   - `notifications` table populated by `fn_notify_disaster_event()` trigger on `disaster_events`.
   - Notification Center Modal reads from DB + streams new rows over Realtime.
   - `mark_all_notifications_read()` RPC + `upsert_global_alert_preference()` RPC.
8. **User profile + settings (DB-backed):**
   - `user_profiles` table (id, email, full_name, avatar_url, role, timestamps) with RLS.
   - `alert_preferences` table (global + per-location rows, disaster_types, radius_km, min_severity, delivery flags) with RLS.
   - Profile Modal + Settings both read/write `full_name` + `avatar_url` to `user_profiles` and delivery flags to `alert_preferences`.
9. **Avatar capture:**
   - Optional avatar URL on email signup (`options.data.avatar_url`), automatic from Google OAuth metadata, editable in Profile Modal and Settings, rendered in header badge.
10. **India region coverage fixed:**
    - Country tags authoritative (ISO `IND`/`IN` only).
    - Coordinate fallback box tightened to India's bounding box (lat 6.5–35.7°N, lng 68.1–97.4°E, including Andaman & Nicobar), excluding Afghanistan, Pakistan, and China.
11. **Static incidents removed:**
    - Deleted the hardcoded `Kosi Basin Monsoon Inundation` fixture from `disasterService.ts`. India view now shows only live feed content (honestly empty when there are no India events).

---

## 3. Technology & Dependency Decisions
- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Leaflet, Lucide React, `@supabase/ssr`.
- **Backend:** Supabase (Auth, PostgreSQL, Realtime, Storage-ready). No separate application server.
- **Auth model:** unified browser client in `src/lib/supabase.ts`; `src/utils/supabase/client.ts` now delegates to it; killed the duplicate `@supabase/supabase-js` client.
- **Basemap Provider:** ESRI World Dark Gray Canvas.
- **Live Data:** USGS, NASA EONET, GDACS, NOAA/NWS tsunami (proxy), optionally ReliefWeb.
- **Signup blocker root cause:** Postgres trigger `on_auth_user_created` → `fn_handle_new_user()` used `ON CONFLICT (id) DO UPDATE` against a hand-created `user_profiles` table with no unique index on `id`, throwing on every signup and rolling back auth. Fixed in `supabase/fix-signup.sql`.

---

## 4. Next Step Checklist
- [x] Rewrite docs to the real Next.js + Supabase architecture (STATUS.md, Memory.md, Architecture.md, Phases.md, PRD.md §8, READMEs, Rules.md).
- [x] Fix signup (replace broken `fn_handle_new_user` trigger in `supabase/fix-signup.sql`).
- [x] Add avatar capture (signup URL field, Google OAuth metadata, profile + settings edit, header badge).
- [x] Remove static incidents; keep only live feeds.
- [x] Fix India region (exclude Afghanistan/China; country tags authoritative; tightened coordinate box).
- [ ] Add avatar file upload via Supabase Storage (paste-URL avatars only today).
- [ ] Add an honest empty-state for the India region view when no live feed has an India event.
- [ ] Surface each event's live source feed (`sourceFeed`) on the incident card as a small chip.
- [ ] Reconcile `supabase/schema.sql` + `supabase/fix-signup.sql` into a single reproducible deploy path (e.g. a CLI/API apply script) so the repo and the live project can't drift again.
- [ ] Phase 2 (next): file-upload avatars, Web Push delivery, saved-locations UX polish, optionally a Gemini guidance phase if the faculty want it.

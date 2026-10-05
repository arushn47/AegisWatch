# AegisWatch — System Status & Active Deliverables

**Project:** AegisWatch — Real-Time Global Natural Disaster Intelligence, Alert & Emergency Assistance Platform
**Milestone:** Phase 1 — Signup + Supabase Auth + DB-backed notifications (current working state)
**Status:** 🟢 **Active, Verified & Running Live**
**Local Access URL:** [http://localhost:3000](http://localhost:3000)
**Last Verified:** 2026-10-03 (signup + avatar capture + India live coverage + static incidents removed)

---

## 1. Executive Summary

AegisWatch Phase 1 is fully operational. The platform is a mission-control situational dashboard built with **Next.js 16 (App Router)** + React 19 + TypeScript + Tailwind CSS, styled against the teammate's **Stitch Design System** (`Orbital Telemetry & Crisis Operations`), and backed by **Supabase** for authentication, the notification workflow database, Realtime streaming, and Web Push groundwork.

The real backend is **Supabase** (PostgreSQL + Auth + Realtime + Storage-ready), **not** a Java/Spring Boot server. The original roadmap described a Spring Boot + PostGIS backend; the project's actual runtime converged on Supabase instead, and the docs are being reconciled to that reality.

---

## 2. Live Application Runtime

| Component | Technology | Runtime Status | Access / Port |
|---|---|---|---|
| **Frontend Web App** | Next.js 16.3.4 (Turbopack, App Router) | 🟢 RUNNING | [http://localhost:3000](http://localhost:3000) |
| **Styling Engine** | Tailwind CSS + Stitch Tactical Tokens | 🟢 ACTIVE | `src/index.css` / `globals.css` |
| **Interactive Map Engine** | Leaflet + ESRI World Dark Gray Canvas | 🟢 ACTIVE (no watermarks, no keys) | `<TacticalMap />` |
| **Auth** | Supabase Auth (email + Google OAuth) | 🟢 ACTIVE | `src/lib/supabase.ts` |
| **Database** | Supabase PostgreSQL (workflow tables) | 🟢 ACTIVE | `supabase/schema.sql` |
| **Realtime** | Supabase Realtime (notifications / disaster_events) | 🟢 ACTIVE | publication `supabase_realtime` |
| **Dev Server** | `npm run dev` (inside `frontend/`) | 🟢 ACTIVE | Ready anytime |

---

## 3. Active Features & What is Working Right Now

### 3.1 Tactical Mission Control Layout (Exact Stitch Parity)
- **Top Header (`AEGIS WATCH / GLOBAL SENSOR NET`)**:
  - Live animated telemetry status beacon (`SYSTEM OPERATIONAL`, `LIVE TELEMETRY ACTIVE`).
  - Active critical alert counter badge.
  - Notification bell, settings trigger, and user avatar badge (image when `avatar_url` is set, otherwise initials fallback).
- **Tactical Docked Sidebar**:
  - Domain filters (All Disasters, Earthquakes, Wildfires, Cyclones, Floods, Tsunamis, Volcanoes, Landslides, Heatwaves, Blizzards, Droughts, Tornadoes, Avalanches, Solar Storms, Epidemics) with live badge counts.
  - Region switcher: **Global** and **South Asia · India** (live India coverage via GDACS/USGS/NASA — see §3.4).
  - View toggle: Radar map / Nearby Alerts.
- **Relay Status Footer**: operational status readout.

### 3.2 High-Contrast Interactive Vector Radar Map
- **Clean Basemap**: ESRI World Dark Gray Canvas (zero watermark, zero API key, 100% dark mode).
- **Pulsing Radar Beacons**: Custom CSS keyframe-animated beacon rings color-coded by hazard type and severity.
- **Dynamic Interaction**: clicking an incident card or marker pans/zooms the map to the event coordinates.
- **Coordinate Telemetry HUD**: cursor lat/lng/zoom readout on hover.

### 3.3 Live Multi-Hazard Telemetry Stream (Real Feeds Only — No Static Fixtures)
- **USGS** — global earthquakes (past 24h, M2.5+) + Indian subcontinent / Himalayan belt significant quakes (M4.5+, past 7 days). Labeled `USGS Real-Time Feed`.
- **NASA EONET** — open natural events (wildfires, severe storms, floods, volcanoes, landslides, temperature extremes, drought, snow). Labeled `NASA EONET`.
- **GDACS** (UN/EC) — tropical cyclones, floods, droughts with explicit alert levels + affected countries. This is the primary **India coverage** source: events affecting India are tagged `isIndiaFocus: true` via ISO3 `IND`/`IN` or coordinates inside India's bounding box. Labeled `GDACS`.
- **NOAA/NWS Tsunami Advisory feeds** (NTWC Palmer + PTWC Honolulu) proxied through `/api/tsunami` and parsed client-side with DOMParser (the upstream feeds have no CORS headers). Only actual Warning/Advisory/Watch bulletins are emitted (Information statements explicitly state no threat and are skipped). Labeled by centre.
- **ReliefWeb (UN OCHA)** — human-curated disasters, enabled only when `NEXT_PUBLIC_RELIEFWEB_APPNAME` is configured (the API requires an approved appname or it returns 403).

**Static incidents removed.** The previous hardcoded "Kosi Basin Monsoon Inundation" fixture has been deleted. The India region view now shows only what the live feeds actually contain; if there are no India events at the moment, the panel is honestly empty rather than showing a stale fake.

### 3.4 India Region Coverage
The **"South Asia · India"** sidebar filter uses two signals:
1. **Country tags (authoritative):** an event is India if its `countries` array contains `IND` or `IN` (ISO3/ISO2).
2. **Coordinate fallback:** when a feed does not tag the country, the event is treated as India if its coordinates fall inside India's bounding box (lat 6.5–35.7°N, lng 68.1–97.4°E, including Andaman & Nicobar). This box intentionally excludes Afghanistan, Pakistan, and China.

The previous bounding box (`minLat 6, maxLat 38, minLng 68, maxLng 98`) was over-broad and was surfacing events in Afghanistan and China as "India" — that is fixed.

### 3.5 Authentication — Supabase Auth (Email + Google OAuth)
- **Email signup:** `supabase.auth.signUp({ email, password, options: { emailRedirectTo, data: { avatar_url } } })`. The optional avatar URL is stored in `raw_user_meta_data` so the signup trigger picks it up the same way Google OAuth does.
- **Google OAuth:** `supabase.auth.signInWithOAuth({ provider: 'google' })`. Google populates `raw_user_meta_data` with the profile picture automatically.
- **Login:** `supabase.auth.signInWithPassword`.
- **Password reset:** `supabase.auth.resetPasswordForEmail` → `/reset-password`.
- **Session handling:** single canonical browser client in `src/lib/supabase.ts` (`@supabase/ssr` `createBrowserClient`, single cached instance). Server client in `src/utils/supabase/server.ts`. `src/proxy.ts` (renamed from `middleware.ts`) refreshes the session on every request and protects `/settings`.
- **Friendly error mapping:** `AuthModal.tsx` translates common Supabase errors (including the former "Database error saving new user" signup failure) into actionable messages.

### 3.6 Signup Trigger Fix (Supabase `auth.users` → `user_profiles`)
The **real blocker** for signup was a Postgres trigger `on_auth_user_created` → `fn_handle_new_user()` that used `ON CONFLICT (id) DO UPDATE` against a `user_profiles` table created by hand **without a unique index on `id`**. That made the trigger throw on every signup and, because the error was unhandled, roll back the entire `auth.users` insert → the "Database error saving new user" screen.

Fixed in `supabase/fix-signup.sql`:
- `fn_handle_new_user()` now uses `ON CONFLICT DO NOTHING` (no target) for the profile insert — works regardless of which unique constraint `user_profiles` actually has.
- Both the profile insert and the default alert-preference insert are wrapped in their own `BEGIN … EXCEPTION` blocks, so a profile/preference failure **never rolls back the auth transaction**.
- The trigger is re-created to point at the new function.

### 3.7 Database-Backed Notification Center + Realtime
- **`notifications` table** populated by the `fn_notify_disaster_event()` trigger on `disaster_events` (fan-out to every user whose `alert_preferences` match the event, with a 30-minute cooldown, a per-event dedupe key, and a 12-hour freshness gate on insert).
- **Notification Center Modal** (`NotificationCenterModal.tsx`) reads from the DB and streams new rows over Realtime.
- **`mark_all_notifications_read()`** RPC marks the current user's unread rows read.
- **Realtime:** `notifications` and `disaster_events` are added to the `supabase_realtime` publication; `notifications` uses replica identity `FULL` so UPDATE events (e.g. `is_read = true`) carry every column.

### 3.8 User Profile + Settings (DB-backed)
- **`user_profiles`** table (id, email, full_name, avatar_url, role, created_at, updated_at) with RLS and owner-only policies.
- **Profile Modal** (`ProfileModal.tsx`) and **Settings** (`/settings`, `SettingsClient.tsx`) both read + write `full_name` and `avatar_url` to `user_profiles`, and sync delivery flags to `alert_preferences`.
- **Avatar capture:** optional avatar URL on email signup (`options.data.avatar_url`), automatic avatar from Google OAuth metadata, editable in both the Profile Modal and Settings. Header badge renders the image when present, initials fallback otherwise.

### 3.9 Alert Preferences (DB-backed)
- **`alert_preferences`** table: per-user global row (`location_id IS NULL` = watch everywhere) plus per-location rows, with disaster_types array, radius_km, min_severity, in_app/push/email delivery flags.
- **`upsert_global_alert_preference()`** RPC upserts the global row correctly despite the partial unique indexes.
- Default for new signups: watch everywhere, all hazard types, HIGH+ severity, in-app on (set by the signup trigger).

### 3.10 Ingestion into Supabase
- The dashboard polls the live feeds in the browser every 60s and forwards normalized events to **`public.ingest_disaster_events(jsonb)`** (SECURITY DEFINER RPC), which upserts into `disaster_events` by id. The insert/update fires `fn_notify_disaster_event()` to generate notifications.
- No static/simulated incidents are injected — everything comes from the live feeds above.

### 3.11 PWA / Service Worker groundwork
- Service worker registration, manifest, icons, and offline fallback page are present. VAPID / Web Push subscription storage (`push_subscriptions` table) is wired for the next phase.

---

## 4. Complete Project Documentation Suite

| File Link | Description & Scope |
|---|---|
| **[PRD.md](./docs/PRD.md)** | Product Requirements Document (vision, personas, goals). **See §8 for the current-implementation-vs-planned reconciliation** — the original PRD describes a Spring Boot backend; the live runtime is Supabase. |
| **[Architecture.md](./docs/Architecture.md)** | **Rewritten to the real architecture**: Next.js App Router + Supabase (Auth, DB, Realtime, Storage-ready). The old Spring Boot + PostGIS + Redis + Gemini architecture is obsolete. |
| **[Rules.md](./docs/Rules.md)** | Development & AI safety guardrails, updated to the real stack (Supabase, not Spring Boot). The deterministic-risk and mandatory-disclaimer axioms still hold. |
| **[Phases.md](./docs/Phases.md)** | **Rewritten roadmap** around the actual Supabase-backed delivery path instead of the Java/PostGIS plan. |
| **[Design.md](./docs/Design.md)** | Complete visual design system (still accurate — unchanged). |
| **[Memory.md](./docs/Memory.md)** | **Updated** active session state to current reality. |
| **[STATUS.md](./docs/STATUS.md)** | **This file** — current system deliverables & talking points. |
| **[.env.example](./.env.example)** | Supabase env var blueprint (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `supabase service_role key` for server actions). |
| **[supabase/schema.sql](./supabase/schema.sql)** | Idempotent Supabase schema: workflow tables, RLS, triggers (`fn_handle_new_user`, `fn_notify_disaster_event`), ingest RPC, grants, Realtime publication. |
| **[supabase/fix-signup.sql](./supabase/fix-signup.sql)** | The signup-recovery script that replaced the broken `fn_handle_new_user` trigger. |

---

## 5. Summary of What Changed Since the Last Doc Update

1. **Backend converged on Supabase**, not Java/Spring Boot. Auth, DB, Realtime, and the notification workflow all live in Supabase.
2. **Signup now works.** The broken `fn_handle_new_user` trigger was replaced with a version that can't abort the auth transaction (see §3.6 and `supabase/fix-signup.sql`).
3. **Avatar capture added.** Optional avatar URL on email signup, automatic from Google OAuth, editable in Profile Modal and Settings, rendered in the header badge.
4. **India region fixed.** Afghanistan and China no longer surface as "India"; India coverage is live via GDACS/USGS/NASA with country tags authoritative and a tightened coordinate fallback box.
5. **Static incidents removed.** The hardcoded Kosi Basin fixture is gone; India view shows only live feed content.
6. **Notification center + Realtime** are DB-backed and streaming, not a simulated feed.
7. **Profile + Settings** read/write `full_name` and `avatar_url` to `user_profiles` and delivery flags to `alert_preferences`.

---

## 6. How to Run the Project for Presentation

```bash
# 1. Open Terminal and navigate to the frontend folder
cd "d:\CODING\Project Exhibition\Capstone Phase-1\DisasterWatch\frontend"

# 2. Make sure .env is present (it is local-only, not in git)
#    It must contain NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
#    plus the service_role key for server-side actions.

# 3. Launch the Next.js development server
npm run dev

# 4. Open in Browser
#    Navigate to: http://localhost:3000
```

### Key Presentation Talking Points
1. **The Core Axiom:** *"Data and deterministic rules detect risk. AI explains the situation and assists the user."* (The deterministic layer is now the Supabase notification trigger + alert-preference matching, not a PostGIS spatial engine.)
2. **Signup works end-to-end:** email or Google, with an optional avatar that shows up in the header and profile.
3. **Live data, no static fixtures:** every marker on the map comes from a real feed (USGS, NASA EONET, GDACS, NOAA tsunami, optionally ReliefWeb). The India panel is live and honest — if it's quiet, that's the real state.
4. **Notifications are real:** the bell shows DB-backed notifications generated by the Supabase trigger when a new event matches your alert preferences, streamed in-app over Realtime.
5. **India coverage is real, not simulated:** GDACS tags events by affected country, so an India-tagged cyclone/flood/drought shows up in the India view with its real alert level and official GDACS bulletin.

---

## 7. Known Limitations (Honest, for Faculty Q&A)

- **No AI emergency guidance yet.** The original roadmap's "Google Gemini AI guidance" phase is not built. The app does not call any LLM today; the `EmergencyDisclaimer.tsx` and the advisory text on each incident are deterministic, written by the feed adapters / the notification trigger.
- **No file-upload avatar yet.** Avatars are URL-based today (paste a URL, or get one from Google). A Supabase Storage upload flow is a later phase.
- **ReliefWeb is opt-in.** It needs an approved `NEXT_PUBLIC_RELIEFWEB_APPNAME` or it silently returns no events.
- **The `.env` file is local-only** (in your project root, not in git), so the repo cannot be cloned and run as-is without the Supabase credentials.

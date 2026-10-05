# AegisWatch — Phased Implementation Roadmap

**Project Scope:** Final Year Capstone Project
**Strategic Focus:** Agile Delivery with a High-Impact Working Prototype for the **Monday Exhibition Review**
**Version:** 2.0.0 (rewritten around the real Supabase-backed runtime)

---

## Roadmap Overview

```text
┌────────────────────────────────────────────────────────────────────────────┐
│ PHASE 1 (CURRENT): TACTICAL RADAR + SUPABASE AUTH + DB-BACKED NOTIFICATIONS │
│ • Next.js 16 App Router frontend (React 19 + TS + Tailwind + Leaflet)        │
│ • Stitch Mission Control layout (Header, Sidebar, KPI, Incident List)         │
│ • Live multi-hazard feeds: USGS, NASA EONET, GDACS, NOAA tsunami, ReliefWeb  │
│ • Supabase Auth (email + Google OAuth) + session-refresh middleware           │
│ • Supabase DB workflow tables (user_profiles, alert_preferences, notifications)│
│ • Signup trigger (fn_handle_new_user) + notification fan-out trigger           │
│ • Realtime notification center + PWA/service-worker groundwork                │
│ • Avatar capture (signup URL / Google metadata / profile + settings edit)      │
│ • India region coverage (GDACS tags + tightened coordinate box)               │
│ • Static incidents removed — only live feeds, honest empty states             │
└───────────────────────────────────┬────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ PHASE 2: AVATAR FILE UPLOAD + WEB PUSH DELIVERY                              │
│ • Supabase Storage bucket for avatar uploads (RLS: users own their files)     │
│ • File picker in profile modal + storage URL written to user_profiles.avatar_url│
│ • Web Push subscription flow (push_subscriptions table + VAPID)               │
│ • Push delivery from the notification trigger (web_push channel)              │
└───────────────────────────────────┬────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ PHASE 3: SAVED LOCATIONS UX + ALERT PREFERENCES POLISH                       │
│ • Add/manage saved locations in settings (lat/lng + geolocation pickup)        │
│ • Per-location alert preferences (which hazards, radius, min severity)         │
│ • Map markers for saved locations + primary-location indicator                 │
│ • Honest empty-state messaging when a region view has no live events           │
└───────────────────────────────────┬────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ PHASE 4: INCIDENT CARD DETAIL + SOURCE-FEED CHIPS + INDIA COVERAGE POLISH     │
│ • Show each event's live source feed (usgs, gdacs, nasa_eonet, noaa_ntwc,     │
│   reliefweb) as a small chip on the incident card                             │
│ • India text-match detection (feed titles/regions that name India) as a third  │
│   signal alongside country tags + coordinate box                              │
│ • India region empty-state messaging (live from GDACS/USGS/NASA; currently     │
│   quiet is the honest state)                                                 │
└───────────────────────────────────┬────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ PHASE 5: RELIEFWEB DEFAULT-ON + ADDITIONAL LIVE FEEDS                         │
│ • Make ReliefWeb usable by default where an appname is available              │
│ • Evaluate additional India-relevant live sources (IMD bulletins if            │
│   machine-readable, national disaster feeds where terms allow)                │
│ • Feed health indicators in the relay status footer (per-feed latency/errors)  │
└───────────────────────────────────┬────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ PHASE 6: DETERMINISTIC RISK + PROXIMITY (Supabase-side, no PostGIS required)  │
│ • Deterministic proximity evaluation in the DB (haversine + bounding boxes)    │
│ • Per-user risk summary API (which active events are near my saved locations)  │
│ • Risk tiers on incident cards / notification body text                       │
│ • Mandatory civil-protection disclaimer on every risk view                    │
└───────────────────────────────────┬────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ PHASE 7: AI EMERGENCY GUIDANCE (OPTIONAL — ONLY IF FACULTY WANT IT)          │
│ • If desired: a backend-mediated explainer over verified event facts          │
│ • No LLM ever determines risk; deterministic proximity already does that       │
│ • Mandatory disclaimer + anti-hallucination constraints                       │
└───────────────────────────────────┬────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ PHASE 8: RESEARCH & HISTORICAL ANALYTICS                                     │
│ • Historical aggregation of ingested disaster_events (by type, severity,       │
│   region, India-focus) over time                                             │
│ • Recharts tactical views (frequency, severity distribution, India vs global) │
│ • Dataset export (GeoJSON / CSV) of the ingested event history                 │
└───────────────────────────────────┬────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ PHASE 9: POLISH, REPRODUCIBILITY & EXHIBITION REHEARSAL                      │
│ • Single reproducible Supabase deploy path (CLI/API apply of schema.sql so     │
│   the repo and the live project can't drift)                                 │
│ • .env.example + local-setup instructions so a fresh clone can run            │
│ • End-to-end demo script + slide deck + architecture diagrams                 │
│ • Final rehearsal against the live feeds (no static placeholders)             │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Tactical Radar + Supabase Auth + DB-Backed Notifications (Current Working State)

**Goal:** Deliver a visually stunning, responsive, interactive web application matching the Stitch Mission Control designs, backed by a real auth + database + notifications stack, with only live feeds (no static placeholders).

### Deliverables:
1. **Repository & Build Setup**:
   - Next.js 16 (App Router, Turbopack in dev) + React 19 + TypeScript + Tailwind CSS in `frontend/`.
   - Tailwind configured with the complete Stitch tactical color palette and typography.
   - Material Symbols and JetBrains Mono + Plus Jakarta Sans + Inter fonts.
   - `.env.example` committed; real `.env` (Supabase URL + anon key + service_role key) is local-only.
2. **Tactical Mission Control Layout (Exact Stitch Parity)**:
   - Header with operational status indicators (`SYSTEM OPERATIONAL`, `LIVE TELEMETRY ACTIVE`), notification bell + unread count, settings trigger, user avatar badge (image when `avatar_url` is set, initials fallback otherwise).
   - Sidebar with domain filters and region switcher (Global / South Asia · India).
   - KPI banner, incident list, incident detail modal, nearby alerts modal, recent alerts modal, notification center modal, emergency disclaimer, PWA status widget, relay status footer.
3. **Interactive Global Radar Map** (`TacticalMap.tsx`, `'use client'`, `ssr: false`):
   - ESRI World Dark Gray Canvas basemap (zero watermark, zero API key).
   - Pulsing beacon markers color-coded by hazard domain + severity.
   - Click-to-pan to incident coordinates.
4. **Live Multi-Hazard Data Stream (real feeds only — no static fixtures)**:
   - **USGS** — global earthquakes (M2.5+, past 24h) + Indian subcontinent / Himalayan belt significant quakes (M4.5+, past 7 days).
   - **NASA EONET** — open natural events (wildfires, storms, floods, volcanoes, landslides, temperature extremes, drought, snow).
   - **GDACS** (UN/EC) — tropical cyclones, floods, droughts with alert levels + affected countries. **Primary India coverage source.**
   - **NOAA/NWS tsunami advisories** — NTWC Palmer + PTWC Honolulu, proxied through `/api/tsunami`, parsed client-side with DOMParser. Only Warning/Advisory/Watch emitted.
   - **ReliefWeb (UN OCHA)** — opt-in, requires approved `NEXT_PUBLIC_RELIEFWEB_APPNAME`.
5. **Supabase Auth** (`src/lib/supabase.ts` + `src/utils/supabase/`):
   - Single canonical browser client (`@supabase/ssr` `createBrowserClient`, cached).
   - Server client in `src/utils/supabase/server.ts`.
   - `src/proxy.ts` (renamed from `middleware.ts`) refreshes the session on every request + protects `/settings`.
   - Email signup (with optional `avatar_url` in `options.data`), email login, Google OAuth, password reset.
6. **Signup trigger fix** (`supabase/fix-signup.sql`):
   - Replaced the broken `fn_handle_new_user()` (which used `ON CONFLICT (id) DO UPDATE` against a `user_profiles` table with no unique index on `id`, aborting every signup) with a version that uses `ON CONFLICT DO NOTHING` + per-insert `BEGIN … EXCEPTION` blocks so a profile/preference failure never rolls back auth.
7. **Database-backed notification center + Realtime**:
   - `notifications` table populated by `fn_notify_disaster_event()` trigger on `disaster_events` (fan-out to every user whose `alert_preferences` match, with a 30-minute cooldown, dedupe key, and 12-hour freshness gate on insert).
   - Notification Center Modal reads from DB + streams new rows over Realtime.
   - `mark_all_notifications_read()` + `upsert_global_alert_preference()` RPCs.
8. **User profile + settings (DB-backed)**:
   - `user_profiles` (id, email, full_name, avatar_url, role, timestamps) + `alert_preferences` (global + per-location rows, disaster_types, radius_km, min_severity, delivery flags) with RLS + owner-only policies.
   - Profile Modal + Settings both read/write `full_name` + `avatar_url` to `user_profiles` and delivery flags to `alert_preferences`.
9. **Avatar capture**:
   - Optional avatar URL on email signup (`options.data.avatar_url`), automatic from Google OAuth metadata, editable in Profile Modal and Settings, rendered in header badge.
10. **India region coverage fixed**:
    - Country tags authoritative (ISO `IND`/`IN` only).
    - Coordinate fallback box tightened to India's bounding box (lat 6.5–35.7°N, lng 68.1–97.4°E, including Andaman & Nicobar), excluding Afghanistan, Pakistan, and China.
11. **Static incidents removed**:
    - Deleted the hardcoded `Kosi Basin Monsoon Inundation` fixture. India view now shows only live feed content (honestly empty when there are no India events).

---

## Phase 2: Avatar File Upload + Web Push Delivery

### Deliverables:
1. Supabase Storage bucket for avatars (public or private-with-signed-url), RLS so users can only read/write their own files.
2. File picker in the profile modal + storage URL written to `user_profiles.avatar_url` (replacing the paste-a-URL-only flow).
3. Remove-avatar affordance.
4. Web Push subscription flow: `push_subscriptions` table + VAPID keys + subscription from the browser, stored per-user.
5. Push delivery from the notification trigger (`web_push` channel) when a matching event generates a notification.

---

## Phase 3: Saved Locations UX + Alert Preferences Polish

### Deliverables:
1. Add/manage saved locations in settings (label + lat/lng + geolocation pickup button).
2. Per-location alert preferences (which hazard types, radius, min severity) in addition to the global row.
3. Map markers for saved locations + primary-location indicator.
4. Honest empty-state messaging when a region view (especially India) has no live events.

---

## Phase 4: Incident Card Detail + Source-Feed Chips + India Coverage Polish

### Deliverables:
1. Show each event's live source feed (`sourceFeed`: `usgs`, `gdacs`, `nasa_eonet`, `noaa_ntwc`, `reliefweb`) as a small chip on the incident card and in the detail modal.
2. India text-match detection as a third signal: feed titles/regions that name India count as India-focus even when ISO tags are absent (in addition to country tags + coordinate box).
3. India region empty-state messaging: "Live from GDACS, USGS, and NASA EONET — no India events right now."

---

## Phase 5: ReliefWeb Default-On + Additional Live Feeds

### Deliverables:
1. Make ReliefWeb usable by default where an `appname` is available (graceful no-op otherwise).
2. Evaluate additional India-relevant live sources where terms allow (e.g. IMD bulletins if machine-readable; national disaster feeds where the terms permit automated access).
3. Per-feed health indicators in the relay status footer (latency, last-error).

---

## Phase 6: Deterministic Risk + Proximity (Supabase-side, no PostGIS required)

### Deliverables:
1. Deterministic proximity evaluation in the DB using the existing `fn_haversine_km` + bounding-box helpers (no PostGIS extension needed).
2. Per-user risk summary: which active `disaster_events` are near the user's saved locations, by distance band.
3. Risk tier shown on incident cards / notification body text (e.g. "74 km from your saved location — monitor").
4. Mandatory civil-protection disclaimer on every risk view (already present via `EmergencyDisclaimer.tsx`; extend to risk surfaces).

---

## Phase 7: AI Emergency Guidance (Optional — only if faculty want it)

### Deliverables:
1. If desired: a backend-mediated explainer over verified event facts only.
2. No LLM ever determines risk — deterministic proximity (Phase 6) already does that.
3. Mandatory disclaimer + anti-hallucination constraints (no invented emergency numbers, no invented shelter capacity).

---

## Phase 8: Research & Historical Analytics

### Deliverables:
1. Historical aggregation of ingested `disaster_events` (by type, severity, region, India-focus) over time.
2. Recharts tactical views (frequency, severity distribution, India vs global).
3. Dataset export (GeoJSON / CSV) of the ingested event history.

---

## Phase 9: Polish, Reproducibility & Exhibition Rehearsal

### Deliverables:
1. Single reproducible Supabase deploy path: a script (CLI/API) that applies `supabase/schema.sql` + `supabase/fix-signup.sql` to the live project so the repo and the live project can't drift.
2. `.env.example` + local-setup instructions so a fresh clone can run (right now the real `.env` is local-only).
3. End-to-end demo script + slide deck + architecture diagrams.
4. Final rehearsal against the live feeds (no static placeholders, honest empty states).

---

## How the roadmap differs from the original

The original roadmap described a **Java 21 + Spring Boot 3.x backend with PostgreSQL + PostGIS + Redis**, Spring Security JWT auth, SSE real-time, and a Gemini AI guidance phase. The project's actual runtime converged on **Supabase** instead (Next.js App Router frontend + managed Supabase backend for auth, DB, Realtime, and Storage-ready). The phases above reflect what is actually being built. The product *vision* from the PRD (multi-source ingestion, deterministic risk, explainer guidance, nearby assistance, historical analytics) is still the aspiration; the implementation path to get there is different — and currently working.

# DisasterWatch — Development Rules & AI Behavioral Guardrails

**Document Status:** Mandatory Enforcement  
**Scope:** All Developers, Subagents, and AI Assistants working on DisasterWatch  
**Version:** 1.0.0  

---

## 1. Core Architectural Axioms & AI Safety Guardrails

### 1.1 The Deterministic Risk Boundary
> [!CRITICAL]
> **RULE 1.1**: The Risk Engine MUST be 100% deterministic, mathematical, and reproducible.
- Under NO circumstance may any LLM determine, classify, upgrade, downgrade, or infer a user's risk rating (`SAFE`, `MONITORING`, `WARNING`, `HIGH RISK`).
- All risk assessments are computed exclusively via deterministic functions (in the current build, pure-arithmetic haversine distance + bounding-box checks in Supabase SQL — `fn_haversine_km`, `INDIA_BBOX` — not PostGIS, because the schema is independent of extension provisioning).
- AI's role is strictly limited to explaining verified telemetry and offering plain-language emergency preparedness checklists. The current build does **not** call any LLM; advisory text is deterministic.

### 1.2 Zero Hallucination Policy for Life Safety Information
> [!CAUTION]
> **RULE 1.2**: AI must never synthesize, fabricate, or guess life-safety information.
- The AI context builder must only feed Gemini verified data extracted from system records (magnitude, depth, recorded wind speeds, official bulletins).
- The AI must NEVER invent national emergency contact numbers, local helpline numbers, or specific evacuation routes unless they are present in verified database records.
- If a data point is missing from the payload (e.g., casualty numbers or specific shelter capacity), Gemini must explicitly state: *"Information currently unavailable from official feeds."*

### 1.3 Client-Side AI Isolation
> [!IMPORTANT]
> **RULE 1.3**: If AI guidance is ever added, the client application must NEVER communicate directly with the LLM API.
- Any LLM API key must **never** be exposed in client bundles (no `NEXT_PUBLIC_GEMINI_API_KEY` or equivalent).
- All AI queries must route through a server-side mediator (in the current architecture, a Supabase Edge Function / RPC with SECURITY DEFINER, or a Next.js server action) that sanitizes inputs, injects verified disaster context, applies safety prompt boundaries, and returns structured responses.
- The current build does not include AI guidance, so this rule is prospective.

### 1.4 Mandatory Emergency Disclaimer
> [!WARNING]
> **RULE 1.4**: All UI views presenting hazard alerts, risk evaluations, or AI advice must prominently feature the official disclaimer:
> *"DisasterWatch is an informational decision-support tool. It does not replace official emergency broadcast systems or lawful instructions from civil defense authorities."*

---

## 2. Technology Stack Boundaries & Library Policies

### 2.1 Approved Frontend Libraries
- **Core**: React 19 (`react`, `react-dom`), TypeScript (`strict: true`), Next.js 16 (App Router).
- **Styling**: Tailwind CSS configured strictly with the **Stitch Tactical Design System** tokens (see `Design.md`).
- **Icons**: Lucide React (`lucide-react`) and Google Material Symbols Outlined.
- **Mapping**: Leaflet (`leaflet`) for tile rendering (ESRI World Dark Gray Canvas, zero API key). MapLibre GL JS is acceptable if a vector style is needed later.
- **State & Server Cache**: React state + effects for the live feed poll (loads are kicked off from `page.tsx` effects and re-fetch every 60s); Supabase clients handle their own caching. Zustand is acceptable for viewport/filter state if needed; TanStack Query is acceptable for server-state caching if the data shape grows.
- **Data Visualization**: Recharts (`recharts`) styled with tactical dark theme and monospace labels (for the later analytics phase).

### 2.2 Forbidden Frontend Libraries & Practices
- ❌ **Do NOT use Tailwind utility colors directly** (e.g., `bg-red-500`, `bg-blue-600`). Use system design tokens: `bg-secondary-container`, `bg-primary`, `text-tertiary`, `bg-surface-container`.
- ❌ **Do NOT use heavy, generic UI frameworks** (MUI, Ant Design, Bootstrap, Chakra) that pollute the CSS bundle and violate the tactical aerospace aesthetic.
- ❌ **Do NOT introduce heavy client-side GIS computation engines** (e.g., Turf.js for massive polygon intersection) unless the Supabase-side deterministic helpers can't express the calculation. The current build uses pure-arithmetic haversine + bounding boxes in Supabase SQL; prefer that over client-side geometry libraries.

### 2.3 Backend (Supabase — the live runtime)
- **Auth**: Supabase Auth (email + password, Google OAuth, session refresh in `proxy.ts`).
- **Database**: Supabase PostgreSQL. Workflow tables (`user_profiles`, `saved_locations`, `alert_preferences`, `disaster_events`, `notifications`, `push_subscriptions`), RLS policies, triggers (`fn_handle_new_user`, `fn_notify_disaster_event`), and RPCs (`ingest_disaster_events`, `mark_all_notifications_read`, `upsert_global_alert_preference`).
- **Real-time**: Supabase Realtime (`supabase_realtime` publication; `notifications` + `disaster_events`; `notifications` replica identity FULL).
- **Storage (future)**: Supabase Storage bucket for avatar uploads (not wired yet).
- **Migrations**: idempotent SQL in `supabase/schema.sql` + the signup-recovery `supabase/fix-signup.sql`. Prefer a single reproducible apply step (CLI/API) over hand-running SQL in the dashboard.

### 2.4 Forbidden Backend Practices
- ❌ **Do NOT hand-edit the live Supabase schema in ways that diverge from `supabase/schema.sql` without updating the file.** The repo is the source of truth for the schema; the dashboard SQL Editor is the deployment target. If a change is made in the dashboard, mirror it in `schema.sql` so the two can't drift.
- ❌ **Do NOT add a separate application server (Java/Spring Boot, Node, etc.) unless a real requirement forces it.** The current runtime is Supabase-managed; adding a server reopens auth, connection, and deployment complexity that Supabase already solves.
- ❌ **Do NOT introduce heavyweight message brokers** (Kafka, RabbitMQ). Supabase Realtime (PostgreSQL replication publication) satisfies the real-time requirement; the notification trigger produces notifications deterministically, not via an async queue.

---

## 3. Code Quality & Aesthetic Guidelines

### 3.1 Layout & Rendering Performance
- **Zero Layout Jitter**: All dynamic numerical readouts (coordinates, magnitudes, Richter scales, UTC clocks) must use `font-mono` (`JetBrains Mono`) with tabular numbers (`tabular-nums`) to prevent optical wobble during live streaming.
- **Marker Virtualization**: Map markers must be rendered efficiently or clustered if count exceeds 200 items to guarantee smooth 60fps panning.
- **No Broken Placeholders**: Never render broken image tags or empty placeholder rectangles. Always use tactical SVG fallback skeletons or live map markers.

### 3.2 Separation of Concerns
- Component files must not exceed 250 lines. Extract sub-components (e.g., `IncidentCard`, `HazardPill`, `TelemetryHUD`).
- Business logic, coordinate transformations, and data formatting must be isolated into dedicated utility functions or custom hooks (`useDisasters`, `useRiskEngine`).

---

## 4. Privacy & Location Handling

1. **Explicit Geolocation Consent**: The browser's `navigator.geolocation` API must only be triggered when the user explicitly clicks the "Current Location" or "Radar Sync" button.
2. **Coordinate Protection**: Exact user coordinates must never be logged in application logs (`INFO` or `ERROR` level).
3. **Storage Minimization**: Saved user locations must allow one-click deletion, which cascades and purges all associated historical `RiskAssessment` records.

---

## 5. Ingestion Pipeline & Fault Tolerance

1. **Failure Isolation**: An exception or network timeout in one external source adapter (e.g., NASA EONET downtime, a GDACS 5xx, a tsunami proxy failure) must be trapped and logged without terminating the other feeds. Each adapter returns `[]` on failure, and `fetchAllDisasters()` awaits them in parallel with `Promise.all`, so one failure cannot block the rest.
2. **Rate Limit Courtesy**: All outbound HTTP requests must respect upstream vendor rate limits. The tsunami proxy caches upstream responses for 120s (`revalidate = 120` in `/api/tsunami/route.ts`); the main feed poll runs every 60s in the browser. Do not shorten the poll interval to chase freshness — if a feed needs finer granularity, prefer its curated real-time stream (e.g. USGS GeoJSON) over polling more often.
3. **Data Freshness & Caching**: There is no Redis in the current build. Freshness is handled by the 60s browser poll + the 120s tsunami proxy cache + Supabase-side dedupe in the `ingest_disaster_events` upsert (idempotent by event id). Do not introduce Redis unless a real cache-eviction requirement appears.

---

## 6. Development Workflow & Session Memory Protocol

1. **Phased Execution**: Features must be implemented according to the **current** `Phases.md` (rewritten around the Supabase-backed path). Do not reintroduce the old Java/Spring Boot plan as if it were current.
2. **Context Preservation**: As development proceeds, maintain `Memory.md` at the project root. Document completed features, active roadblocks, current file locations, and verification commands to preserve state across multi-turn sessions. When the live runtime changes materially (new backend, new auth model, new real-time mechanism), update `STATUS.md`, `Memory.md`, `Architecture.md`, and `Phases.md` together — not just one of them.
3. **Doc reconciliation on reality shifts**: whenever the actual stack diverges from what the docs describe, fix the docs before adding new features. The most common drift is the old Spring Boot roadmap still being quoted as current — if you see it, update `STATUS.md` + `Memory.md` + `Architecture.md` + `Phases.md` + `PRD.md` §8 + the READMEs + `Rules.md` together.

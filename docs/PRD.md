# DisasterWatch — Product Requirements Document (PRD)

**Project Name:** DisasterWatch  
**Subtitle:** Real-Time Global Natural Disaster Intelligence, Alert & Emergency Assistance Platform  
**Project Category:** Final Year Capstone Project (Engineering & Computer Science)  
**Status:** Approved / Active Baseline  
**Version:** 1.0.0  
**Target Milestone:** Phase 1 Exhibition (Monday Demo) → Full Capstone Defense  

---

## 1. Executive Summary

DisasterWatch is a real-time, AI-assisted geospatial intelligence and decision-support web platform designed to aggregate, normalize, evaluate, and communicate natural-disaster information across the globe in one unified tactical interface.

During critical disaster events, emergency data is severely fragmented across disparate government bodies, geological surveys, meteorological centers, satellite observations, and humanitarian aid registries. The resulting cognitive overload, contradictory alerts, and lack of localized risk comprehension jeopardize life and property.

DisasterWatch resolves this fragmentation by establishing an end-to-end operational pipeline:
1. **Automated Multi-Source Ingestion**: Continuously polling and consuming verified data feeds (USGS, NASA EONET, GDACS, Open-Meteo, FIRMS).
2. **Deterministic Geospatial Risk Engine**: Executing sub-second spatial queries via PostgreSQL + PostGIS (point-in-polygon, buffer radius) to calculate explicit, reproducible risk tiers (`SAFE`, `MONITORING`, `WARNING`, `HIGH RISK`).
3. **AI-Assisted Guidance**: Leveraging Google Gemini as an explainability and emergency guidance layer that translates verified telemetry into plain-language, non-alarmist safety steps.
4. **Nearby Assistance Discovery**: Visualizing proximate hospitals, relief shelters, and emergency aid assets.
5. **Historical & Analytical Intelligence**: Providing researchers and disaster analysts with multi-hazard trend exploration and regional frequency metrics.

### Core Architectural Axiom
> **"Data and deterministic rules detect risk. AI explains the situation and assists the user. Official authorities remain the sole source of lawful emergency directives."**

DisasterWatch operates as an informational and decision-support tool. It explicitly disclaims any role as a replacement for official civil defense broadcasts or sovereign alert systems.

---

## 2. Problem Statement

Natural disaster intelligence suffers from three critical bottlenecks:
1. **Severe Fragmentation**: Understanding an unfolding event requires traversing multiple technical sites (e.g., USGS for seismic depth, GDACS for cyclone paths, NASA FIRMS for fire radiative power, regional emergency agencies for shelters).
2. **Lack of Localized Context**: Most platforms broadcast regional summaries without answering the user's primary question: *"Am I or my family inside the active hazard radius right now?"*
3. **Actionability Deficit**: Scientific datasets deliver raw metrics (depth in km, millibars of barometric pressure, FRP in megawatts) without immediate, plain-language triage instructions or verified nearby relief shelter mapping.

DisasterWatch bridges this gap by unifying:
$$\text{Monitoring} \longrightarrow \text{Mapping} \longrightarrow \text{Risk Detection} \longrightarrow \text{Alerts} \longrightarrow \text{AI Guidance} \longrightarrow \text{Nearby Relief} \longrightarrow \text{Analytics}$$

---

## 3. Target User Personas & Use Cases

### 3.1 General Public & Local Residents
- **Profile**: Individuals living in hazard-prone zones (coastal cyclone belts, seismic fault lines, flood basins).
- **Core Needs**: Instant visual clarity on whether current events threaten their home, plain-language safety precautions, and directions to nearby verified shelters or hospitals.
- **Key Pain Point**: Panicked or sensationalized social media news during crises.

### 3.2 Travelers & Commuters
- **Profile**: Domestic and international travelers navigating unfamiliar regions.
- **Core Needs**: Temporary geo-monitoring of travel destinations, localized hazard notifications, and emergency service contact points in unfamiliar languages.
- **Key Pain Point**: Language barriers and lack of familiarity with regional warning sirens.

### 3.3 Disaster Analysts & Academic Researchers
- **Profile**: University faculty, environmental researchers, and public safety analysts.
- **Core Needs**: Longitudinal disaster frequency tracking, multi-hazard correlation (e.g., torrential rain triggering landslides), spatial density heatmaps, and structured dataset exports.
- **Key Pain Point**: Manually consolidating heterogeneous JSON/GeoJSON schemas across different international APIs.

### 3.4 Platform Operators & Emergency Administrators
- **Profile**: System administrators managing ingestion adapters, verifying community feedback, and checking system health.
- **Core Needs**: Telemetry monitoring of active sensor relays, ingestion latency, API quota health, and failover status.

---

## 4. Product Goals & Measurable Objectives

| Goal ID | Objective | Measurable Success Metric |
|---|---|---|
| **G-1** | Centralized Global Dashboard | Display active global disasters on an interactive vector map with $<1.5\text{s}$ initial render. |
| **G-2** | Automated Multi-Source Ingestion | Ingest from $\ge 4$ authoritative APIs with scheduled adapters and automatic deduplication. |
| **G-3** | Deterministic Risk Engine | Sub-100ms PostGIS geospatial calculation classifying user coordinates into 4 distinct risk tiers. |
| **G-4** | Explainable AI Emergency Guidance | Generate contextualized safety briefs via Google Gemini using strictly bounded system data (zero hallucinated risk levels). |
| **G-5** | Proximity Relief Discovery | Query and display nearest verified hospitals and emergency shelters within user-configured radii. |
| **G-6** | Multi-Hazard Analytics | Filterable charts and geographic aggregation spanning historical trends by hazard category and severity. |

---

## 5. System Non-Goals (Scope Boundaries)

To safeguard project completion and maintain absolute safety compliance, DisasterWatch will **NOT**:
1. **Replace Official Sovereign Alert Systems**: It will never claim authority over government civil protection agencies.
2. **Execute Autonomous Emergency Dispatch**: The platform will not automatically dial 911/112 or dispatch emergency personnel.
3. **Permit AI to Determine Safety Status**: Google Gemini will **never** calculate or alter risk levels; it is strictly an explainability assistant for pre-verified data.
4. **Treat Unverified Crowd Reports as Ground Truth**: Community-submitted observations are segregated into an unverified layer with explicit disclaimers.
5. **Predict Future Disasters via Custom ML**: DisasterWatch displays official forecasts (e.g., cyclone cone of uncertainty from meteorology agencies) rather than generating speculative in-house forecasting models in MVP.

---

## 6. Functional Requirements

### 6.1 Multi-Source Ingestion & Processing Pipeline
- **FR-1.1**: The system shall periodically poll supported external APIs via dedicated, decoupled adapters:
  - **USGS Earthquake Hazards Program**: Global seismic events ($M \ge 2.5$), hypocenter depth, epicenter coordinates, timestamp.
  - **NASA EONET & FIRMS**: Active wildfire hotspots, thermal radiative power, severe storms, volcanoes.
  - **GDACS (Global Disaster Alert and Coordination System)**: Floods, cyclones, tsunamis, and international humanitarian impact ratings.
  - **Open-Meteo Weather Alerts**: Extreme rainfall, atmospheric depressions, storm surges.
- **FR-1.2**: Ingestion pipeline shall isolate adapter failures; an error in one external provider must never interrupt overall platform operations.
- **FR-1.3**: The system shall normalize external records into a standardized internal model:
  ```json
  {
    "id": "dw-quake-usgs-2026-0905a",
    "type": "EARTHQUAKE",
    "title": "M 6.7 - 24km ENE of Miyagi, Japan",
    "severity": "HIGH",
    "status": "ACTIVE",
    "geometry": { "type": "Point", "coordinates": [141.65, 38.32] },
    "affectedAreaPolygon": null,
    "metrics": { "magnitude": 6.7, "depthKm": 24.3, "tsunamiFlag": true },
    "source": "USGS",
    "sourceEventId": "us7000xxxx",
    "timestamp": "2026-09-05T17:18:22Z"
  }
  ```
- **FR-1.4**: Rule-based deduplication shall reconcile coincident events reported across multiple agencies based on temporal window ($\le 30\text{ minutes}$) and spatial proximity ($\le 50\text{ km}$).

### 6.2 Interactive Global Radar & GIS Visualization
- **FR-2.1**: The main dashboard shall feature a high-performance interactive vector map (MapLibre GL JS / Leaflet vector engine) supporting pan, zoom, pitch, and layer toggling.
- **FR-2.2**: Disasters shall render distinct tactical iconography, color halos, and pulsating beacon rings based on hazard domain and severity:
  - Red (`#EF4444` / Crimson): High Risk / Critical ($M \ge 6.5$, Cat 4/5 storms, major uncontrolled fires).
  - Amber (`#F59E0B` / Orange): Watch / Advisory ($M 5.0-6.4$, localized inundation, containment warnings).
  - Cyan (`#06B6D4` / Electric Blue): Minor / Informational ($M 3.0-4.9$, small tropical depressions).
  - Emerald (`#10B981`): Nominal / Resolved baselines.
- **FR-2.3**: Interactive markers shall open an Incident Telemetry Drawer showing event magnitude, hypocentral depth, coordinates, reported felt reports, affected area geometries, and official source links.
- **FR-2.4**: Multi-hazard filtering by hazard type, minimum magnitude/severity, time window (Last 1h, 6h, 24h, 7d), and geographical bounds.

### 6.3 User Locations & Deterministic Geospatial Risk Engine
- **FR-3.1**: Authenticated users can register multiple monitored locations (e.g., "Home", "Campus", "Family in Tokyo").
- **FR-3.2**: Sub-second deterministic risk evaluation using PostGIS spatial predicates:
  - **Level 1 — High Risk**: User location intersects active disaster polygon or is within immediate hazard radius (e.g., within 50km of severe quake $M \ge 6.5$).
  - **Level 2 — Warning**: User is within secondary buffer zone ($50-150\text{km}$) or in the projected path of severe weather.
  - **Level 3 — Monitoring**: User is within peripheral observation zone ($150-300\text{km}$).
  - **Level 4 — Safe**: No active hazards detected within monitored parameters.
- **FR-3.3**: Every risk card must display the deterministic rationale (e.g., *"Warning: You are 74 km from epicenter of M 6.7 seismic event"*).
- **FR-3.4**: Explicit emergency disclaimer must accompany every risk assessment screen:
  > *"Informational assessment only. Follow instructions from local emergency authorities."*

### 6.4 AI Emergency Guidance Assistant (Google Gemini)
- **FR-4.1**: Backend AI Context Builder constructs strict prompt payloads pairing verified incident facts with user risk context.
- **FR-4.2**: Gemini produces concise, bulleted safety instructions (immediate actions, evacuation bag checklists, hazard-specific dos and don'ts).
- **FR-4.3**: Gemini prompt constraints strictly forbid the model from making up emergency hotline numbers or changing risk ratings.

### 6.5 Nearby Emergency Assistance
- **FR-5.1**: Radius-based search querying PostGIS / OpenStreetMap Overpass for critical infrastructure:
  - Hospitals & Trauma Centers
  - Designated Emergency Shelters & Community Relief Centers
  - Fire Stations & Police Headquarters
- **FR-5.2**: Display distance, category badge, and navigation links.

### 6.6 Real-Time Telemetry & Alerts
- **FR-6.1**: Server-Sent Events (SSE) push channel delivering new disaster updates and risk status transitions to active clients in real time.
- **FR-6.2**: In-app notification center and browser Web Push API integration for critical threshold breaches.

### 6.7 Research & Historical Analytics
- **FR-7.1**: Longitudinal query interface with interactive charts (distribution by type, monthly disaster trends, depth vs. magnitude scatter plots).
- **FR-7.2**: Temporal filtering and export of summarized datasets.

---

## 7. Non-Functional Requirements

### 7.1 Performance & Latency
- Dashboard initial page load: $\le 1.8\text{ seconds}$ on standard broadband.
- Map marker interaction and drawer opening: $\le 80\text{ milliseconds}$.
- Spatial risk evaluation query: $\le 120\text{ milliseconds}$ per user location.
- Live data feed caching in Redis with an adaptive TTL (60s for high-frequency seismic, 300s for wildfire summaries).

### 7.2 Reliability & Fault Tolerance
- Total system uptime target: $\ge 99.5\%$ during demonstration.
- Circuit breaker mechanisms on external API consumption (failsafe fallback to latest cached snapshot).
- Database transactions enforce spatial integrity for all GeoJSON polygon writes.

### 7.3 Security & Data Privacy
- Passwords hashed using BCrypt (cost factor 12).
- Stateless JWT authentication with short expiration and secure HTTP headers.
- User geographic coordinates stored with explicit consent, encrypted at rest, and never exposed in unauthenticated public endpoints.
- API keys (Gemini, map tile servers) strictly isolated to backend environment variables.

### 7.4 Usability & Accessibility
- Mission-control dark mode with high contrast ratios ($\ge 4.5:1$ compliant with WCAG 2.1 AA).
- Multi-dimensional status encoding: Status never communicated by color alone (always paired with iconography, text labels, and numeric tags).
- Responsive adaptive layout (12-col desktop command view down to mobile tactical card stack).

---

## 8. Release Roadmap Overview

```text
Phase 1: Tactical Radar + Supabase Auth + DB-backed notifications (Next.js 16 + Supabase) — Monday Exhibition
Phase 2: Avatar file upload (Supabase Storage) + Web Push delivery
Phase 3: Saved locations UX + alert preferences polish
Phase 4: Incident source-feed chips + India coverage polish
Phase 5: ReliefWeb default-on + additional live feeds
Phase 6: Deterministic risk + proximity (Supabase-side, no PostGIS required)
Phase 7: AI emergency guidance (optional — only if faculty want it)
Phase 8: Research & historical analytics (Recharts + export)
Phase 9: Polish, reproducible Supabase deploy + exhibition rehearsal
```

### 8.1 Current Runtime (authoritative — read this before the old roadmap below)

The PRD below and the original roadmap describe a **Java 21 + Spring Boot 3.x backend with PostgreSQL + PostGIS + Redis**, Spring Security JWT auth, SSE real-time, and a Google Gemini AI guidance phase. **That is not what is running.** The live runtime is:

- **Frontend:** Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS + Leaflet.
- **Backend:** Supabase (Auth + PostgreSQL workflow tables + Realtime + Storage-ready). There is no separate Java application server.
- **Real-time:** Supabase Realtime (PostgreSQL replication publication), not SSE.
- **AI guidance:** not built. Advisory text on incidents and in the emergency disclaimer is deterministic, written by the feed adapters and the notification trigger. The app does not call any LLM today.

For the authoritative view of what is actually running, see **[STATUS.md](STATUS.md)** and **[Memory.md](Memory.md)**. For the real architecture, see **[Architecture.md](Architecture.md)** (rewritten). For the real roadmap, see **[Phases.md](Phases.md)** (rewritten).

### 8.2 Why the implementation diverged from the original roadmap

The original roadmap assumed a self-hosted Spring Boot backend. The project's actual runtime converged on Supabase instead, because it delivered a working auth + database + Realtime notifications stack faster than bootstrapping a separate application server, and it kept the demo focused on the live-feed + notification UX rather than infrastructure plumbing. The deterministic-risk and AI-guidance aspirations from the PRD are preserved as later phases (Phase 6 and the optional Phase 7), implemented in Supabase SQL / RPCs rather than a Java engine.

### 8.3 Old roadmap (kept for traceability — do not treat as current)

```text
Phase 1: Tactical Radar Dashboard & Live USGS Seismic Feed (Monday Exhibition Milestone)
Phase 2: Multi-Source Ingestion Pipeline (NASA EONET, GDACS, Open-Meteo, FIRMS)
Phase 3: PostGIS Deterministic Risk Engine & Spatial Radius Logic
Phase 4: Spring Security JWT Authentication & User Location Profiles
Phase 5: Real-Time Alerts (SSE Live Push & Notification Center)
Phase 6: Google Gemini AI Context Builder & Emergency Guidance
Phase 7: Nearby Assistance Service (OSM Overpass Hospitals & Shelters)
Phase 8: Research & Historical Analytics (Recharts & Frequency Trends)
Phase 9: Docker Containerization, Production Optimization & Final Capstone Defense
```

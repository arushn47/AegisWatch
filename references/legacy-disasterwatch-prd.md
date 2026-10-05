# DisasterWatch — Product Requirements Document (PRD)

**Version:** 1.0  
**Status:** Draft  
**Project Type:** Capstone Project  
**Product:** DisasterWatch — Real-Time Global Natural Disaster Intelligence, Alert & Emergency Assistance Platform

---

## 1. Executive Summary

DisasterWatch is a real-time, AI-assisted web platform that aggregates natural-disaster information from multiple reliable sources into one unified system.

During disasters, information is often fragmented across government agencies, scientific organizations, weather services, news platforms, and emergency-management systems. DisasterWatch addresses this problem by continuously ingesting disaster data, validating and normalizing it, displaying it on an interactive global map, evaluating location-based user risk, and providing clear safety guidance and nearby assistance resources.

The platform focuses on the following disaster categories:

- Earthquakes
- Floods
- Cyclones and severe weather
- Wildfires
- Tsunamis
- Other supported natural hazards

The core principle of the system is:

> **Data and deterministic rules detect risk. AI explains the situation and assists the user.**

DisasterWatch is an informational and decision-support platform and **must not replace official emergency alerts or instructions from authorities**.

---

# 2. Problem Statement

Disaster-related information is highly fragmented.

A user experiencing or hearing about a disaster may need to visit multiple websites to answer basic questions:

- What disasters are happening right now?
- Where exactly are they occurring?
- Is my location affected?
- How severe is the situation?
- What should I do?
- Where can I find nearby hospitals, shelters, or emergency assistance?

Existing platforms generally specialize in only one part of this workflow:

- Disaster visualization
- Weather monitoring
- Scientific datasets
- Government alerts
- Emergency response information

There is an opportunity to create a single connected platform that combines:

**Monitoring → Mapping → Risk Detection → Alerts → AI Guidance → Nearby Assistance → Analytics**

---

# 3. Product Vision

> **To turn fragmented global disaster information into timely, understandable, and location-aware action.**

DisasterWatch should provide users with one central platform where they can understand:

1. What is happening.
2. Whether it may affect them.
3. What actions they should consider.
4. Where nearby assistance may be available.

---

# 4. Product Goals

## 4.1 Primary Goals

### G1 — Centralized Disaster Monitoring
Provide a unified dashboard for monitoring active natural disasters globally.

### G2 — Multi-Source Data Integration
Ingest disaster and environmental information from multiple reliable external data sources.

### G3 — Geospatial Risk Awareness
Use deterministic geospatial calculations to assess whether a disaster may affect a user's configured location.

### G4 — Personalized Alerts
Allow users to configure alerts based on:

- Location
- Disaster type
- Distance/radius
- Severity threshold
- Language
- Notification preference

### G5 — AI-Assisted Guidance
Use Google Gemini to transform verified structured disaster information into clear, human-readable guidance.

Gemini must **not independently decide whether a disaster exists or assign the user's risk level**.

### G6 — Nearby Emergency Assistance
Display relevant nearby resources such as:

- Hospitals
- Shelters
- Relief centers
- NGOs
- Emergency services

### G7 — Research and Historical Analytics
Provide historical disaster data and analytics for researchers and analysts.

---

# 5. Non-Goals

The first version of DisasterWatch will **not**:

- Replace government emergency alert systems.
- Guarantee real-time accuracy from every external source.
- Provide emergency dispatch services.
- Automatically contact emergency services.
- Allow AI to make autonomous life-safety decisions.
- Treat community-submitted reports as verified disaster events.
- Build proprietary disaster prediction models in the MVP.

---

# 6. Target Users

## 6.1 General Public

People who want to monitor disasters globally or understand hazards near their location.

### Needs
- Simple visualization
- Clear risk information
- Easy-to-understand guidance
- Nearby assistance information

---

## 6.2 Travelers

Users traveling to unfamiliar regions.

### Needs
- Location-specific hazard awareness
- Destination monitoring
- Emergency resources nearby

---

## 6.3 Researchers and Analysts

Users studying disaster patterns and historical trends.

### Needs
- Historical datasets
- Geographic filtering
- Frequency analysis
- Disaster trends

---

## 6.4 Administrators

Platform operators responsible for:

- Monitoring data sources
- Managing integrations
- Reviewing data quality
- Monitoring system health

---

# 7. Core User Stories

## Monitoring

**US-01**  
As a user, I want to see active disasters worldwide on a map so that I can understand what is currently happening.

**US-02**  
As a user, I want to filter disasters by type and severity so that I can focus on relevant events.

**US-03**  
As a user, I want to click a disaster event and view detailed information about it.

---

## Location and Risk

**US-04**  
As a user, I want to add one or more locations so that DisasterWatch can evaluate hazards near places important to me.

**US-05**  
As a user, I want to see a clear risk level so that I can quickly understand the informational assessment.

**US-06**  
As a user, I want to understand why a risk level was assigned.

---

## Alerts

**US-07**  
As a user, I want to configure disaster alerts based on my location and preferences.

**US-08**  
As a user, I want to receive notifications when relevant risk conditions change.

---

## AI Guidance

**US-09**  
As a user, I want plain-language guidance about a verified disaster event.

**US-10**  
As a user, I want the AI assistant to explain recommended actions without pretending to be an official authority.

---

## Nearby Assistance

**US-11**  
As a user, I want to find nearby hospitals, shelters, and relief resources.

---

## Research

**US-12**  
As a researcher, I want to explore historical disaster data by region, type, and time period.

---

# 8. Functional Requirements

## 8.1 Disaster Data Ingestion

The system shall ingest disaster information from supported external data sources.

### Supported Data Categories

| Category | Examples |
|---|---|
| Earthquakes | Magnitude, depth, coordinates, time |
| Floods | Affected region, severity, status |
| Cyclones/Storms | Position, intensity, trajectory |
| Wildfires | Location, affected area, status |
| Tsunamis | Event region, warning information |
| Other Hazards | Depending on available reliable APIs |

### Requirements

- The system shall periodically poll supported external APIs.
- Each source shall have an independent ingestion adapter.
- Raw responses shall be stored or logged for auditability where practical.
- Failed ingestion attempts shall be retried using controlled retry policies.
- Source failures shall not crash the complete platform.

---

## 8.2 Validation and Normalization

Incoming disaster records shall pass through a processing pipeline:

```text
Fetch
  ↓
Validate
  ↓
Normalize
  ↓
Deduplicate
  ↓
Store
  ↓
Process
  ↓
Display
```

### Validation

The system shall validate:

- Required fields
- Coordinates
- Timestamps
- Disaster type
- Source identity
- Severity values where available

### Normalization

All external records should be transformed into a common internal disaster model.

Example normalized structure:

```json
{
  "id": "uuid",
  "type": "EARTHQUAKE",
  "source": "source-name",
  "sourceEventId": "external-id",
  "title": "Earthquake near...",
  "severity": "HIGH",
  "magnitude": 6.2,
  "geometry": {
    "type": "Point",
    "coordinates": [longitude, latitude]
  },
  "affectedArea": {},
  "eventTime": "ISO-8601",
  "status": "ACTIVE",
  "confidenceScore": 0.95
}
```

---

## 8.3 Deduplication and Cross-Source Correlation

Multiple sources may report the same disaster.

The system should identify potential duplicates using:

- Geographic proximity
- Time proximity
- Disaster category
- External identifiers
- Magnitude/severity similarity

Duplicate detection should initially be rule-based.

Potential duplicates may be grouped into an internal **Disaster Incident**.

---

# 9. Interactive Global Map

The map is the primary visualization layer of DisasterWatch.

## Requirements

Users shall be able to:

- Pan and zoom globally.
- View active disasters.
- Filter by disaster type.
- Filter by severity.
- Filter by status.
- Select a disaster marker.
- View detailed disaster information.
- View affected areas where geographic polygons are available.
- View forecast trajectories when supported by data sources.
- View nearby emergency resources.

## Visualization

Different disaster types should have distinct:

- Icons
- Marker styles
- Layers

Severity should be communicated using:

- Labels
- Symbols
- Accessible visual hierarchy

The UI must not rely only on color for severity differentiation.

---

# 10. User Location Management

Users may add:

- Current location
- Home location
- Work location
- Travel destination
- Other saved locations

For privacy:

- Exact user coordinates should be collected only when required.
- Location access should require user permission.
- Users should be able to remove saved locations.
- Location data should not be unnecessarily retained.

---

# 11. Risk Detection Engine

## 11.1 Core Principle

Risk detection must be:

- Deterministic
- Explainable
- Auditable
- Independent of Gemini

The AI system must not calculate the official DisasterWatch risk classification.

---

## 11.2 Risk Levels

The initial risk classification will include:

| Risk Level | Meaning |
|---|---|
| Safe | No currently detected relevant hazard within configured assessment parameters |
| Monitoring | Relevant hazard exists but direct impact is uncertain or distant |
| Warning | User location is potentially affected |
| High Risk | User location falls within a high-severity or directly affected area |

### Important Disclaimer

Every risk result must display:

> **This assessment is informational and does not replace official emergency alerts or instructions from local authorities.**

---

## 11.3 Risk Calculation Inputs

The risk engine may consider:

- Disaster type
- Distance from the user
- Disaster severity
- Magnitude/intensity
- Affected-area geometry
- Event status
- Event recency
- Forecast trajectory where available

---

## 11.4 Geospatial Processing

PostGIS should be used for:

- Distance calculations
- Point-in-polygon checks
- Radius queries
- Spatial intersections
- Nearest-resource searches

Example logic:

```text
IF user location intersects confirmed affected area
    → HIGH RISK

ELSE IF disaster severity is high AND user is within configured warning radius
    → WARNING

ELSE IF disaster is within monitoring radius
    → MONITORING

ELSE
    → SAFE
```

Actual thresholds should be configurable by disaster type.

---

# 12. Personalized Alert System

Users shall configure:

- Saved location
- Disaster type
- Maximum radius
- Minimum severity
- Preferred language
- Notification channels

## Notification Channels

MVP:

- In-app notifications
- Browser/web push

Later:

- Email
- Mobile push notifications

## Alert Events

Alerts may be triggered when:

- A new relevant disaster is detected.
- Risk level increases.
- Severity increases.
- A forecast trajectory changes.
- A disaster enters the user's configured radius.

The system must prevent notification spam through:

- Deduplication
- Cooldown periods
- Event update grouping

---

# 13. AI Emergency Assistant

## 13.1 Purpose

Google Gemini will convert structured and verified system information into understandable guidance.

Gemini may explain:

- What event is occurring.
- What the current data indicates.
- General safety measures.
- Actions to prioritize.
- Relevant official recommendations supplied to the system.
- Nearby assistance information.

---

## 13.2 AI Constraints

Gemini must:

- Receive structured disaster context.
- Clearly distinguish verified information from unavailable information.
- Avoid claiming to be an official emergency authority.
- Avoid inventing emergency instructions.
- Include official-source links when available.
- Not determine whether a disaster exists.
- Not calculate the user's risk classification.

---

## 13.3 AI Architecture

```text
Verified Disaster Data
        +
User Risk Result
        +
Nearby Assistance
        +
Official Guidance
        ↓
Context Builder
        ↓
Google Gemini API
        ↓
Safety Response
```

A backend context builder should control what information is sent to Gemini.

---

# 14. Nearby Assistance

The platform shall allow users to discover nearby:

- Hospitals
- Emergency shelters
- Relief centers
- NGOs
- Other supported emergency resources

## Requirements

- Search resources near a selected location.
- Display resources on the map.
- Show name, category, address, and available metadata.
- Sort by distance where appropriate.
- Clearly display the source and verification status where available.

**Important:** Availability information should not be assumed to be real-time unless a verified live data source supports it.

---

# 15. Research and Analytics Dashboard

The analytics module shall support historical exploration.

## Features

- Disaster frequency by region
- Disaster frequency by type
- Time-based trends
- Severity distribution
- Map-based historical exploration
- Date-range filtering

## Example Questions

- Which regions experienced the highest number of earthquakes?
- How has wildfire frequency changed over a selected period?
- Which disaster types are most frequently reported in a region?

---

# 16. System Architecture

## High-Level Architecture

```text
┌─────────────────────────────────────────────┐
│            External Data Sources            │
│ Earthquake | Weather | Flood | Fire | etc. │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│           Data Ingestion Layer              │
│ Scheduled Jobs | Source Adapters | Retries  │
└──────────────────────┬──────────────────────┘
                       ▼
┌─────────────────────────────────────────────┐
│       Validation & Normalization Layer      │
│ Validation | Transformation | Deduplication │
└──────────────────────┬──────────────────────┘
                       ▼
┌─────────────────────────────────────────────┐
│          PostgreSQL + PostGIS               │
│ Events | Geometry | Users | Alerts          │
└──────────────────────┬──────────────────────┘
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
┌──────────────────┐       ┌──────────────────┐
│ Risk & Alert     │       │ Nearby Assistance │
│ Engine           │       │ Service           │
└────────┬─────────┘       └────────┬─────────┘
         │                          │
         └────────────┬─────────────┘
                      ▼
┌─────────────────────────────────────────────┐
│         Spring Boot API Layer               │
│ REST APIs | SSE | Authentication            │
└──────────────────────┬──────────────────────┘
                       │
              ┌────────┴────────┐
              ▼                 ▼
      ┌──────────────┐   ┌──────────────┐
      │ React Client │   │ Gemini Layer │
      │ Map + UI     │   │ Guidance     │
      └──────────────┘   └──────────────┘
```

---

# 17. Recommended Technology Stack

## 17.1 Stack Decision

For the capstone, the recommended approach is a **modular monolith architecture**, not microservices.

This gives the project:

- Strong scalability potential
- Easier development
- Easier deployment
- Less operational complexity
- Clear separation of modules

---

## 17.2 Frontend

### Recommended

| Technology | Purpose |
|---|---|
| React | Frontend framework |
| TypeScript | Type safety |
| Vite | Build tooling |
| Tailwind CSS | UI development |
| shadcn/ui | Reusable UI components |
| TanStack Query | Server-state management |
| Zustand | Lightweight client state |
| MapLibre GL JS | Interactive map |
| React Router | Routing |
| Recharts | Analytics charts |

### Why MapLibre GL JS?

**Recommendation: Use MapLibre GL JS rather than making Mapbox the default dependency.**

Advantages:

- Open-source
- Excellent vector-map support
- Suitable for GIS-heavy applications
- Avoids unnecessary vendor dependence
- Works well with OpenStreetMap-based map infrastructure

**Fallback:** Leaflet can be used if the team wants a simpler map implementation.

---

## 17.3 Backend

### Recommended

| Technology | Purpose |
|---|---|
| Java 21 LTS | Primary backend language |
| Spring Boot 3.x | Backend framework |
| Spring Web | REST APIs |
| Spring Data JPA | Data persistence |
| Spring Security | Authentication and authorization |
| Spring Scheduler | Data ingestion scheduling |
| Spring Validation | Request validation |
| Spring WebFlux/WebClient | External API calls |
| Spring Boot Actuator | Monitoring and health checks |

### Architecture

Start with packages/modules such as:

```text
com.disasterwatch
│
├── auth
├── user
├── disaster
├── ingestion
├── normalization
├── risk
├── alerts
├── assistance
├── analytics
├── ai
└── common
```

---

## 17.4 Database

### Primary Database

**PostgreSQL + PostGIS**

This is the most important infrastructure decision for the project.

Use PostGIS for:

- Disaster coordinates
- Affected-area polygons
- Distance queries
- Point-in-polygon risk detection
- Nearby resource searches

### Caching

**Redis**

Use Redis for:

- Frequently accessed active-disaster queries
- API response caching
- Rate limiting
- Temporary event data
- Optional notification queues

---

## 17.5 Real-Time Updates

### Recommended for MVP

**Server-Sent Events (SSE)**

Use SSE for:

- New disaster events
- Disaster updates
- Risk updates
- Dashboard refreshes

Why SSE first?

- Simpler than WebSockets
- Server → client communication matches the primary use case
- Easier to implement in a capstone project

### Future

Use WebSockets if bidirectional real-time communication becomes necessary.

---

## 17.6 Authentication

### Recommended

**Spring Security + JWT**

Features:

- User registration
- Login
- Protected APIs
- Role-based access control

Roles:

```text
USER
RESEARCHER
ADMIN
```

For faster development, an external identity provider can be considered, but Spring Security + JWT provides stronger backend learning value for a Java-focused capstone.

---

## 17.7 AI

### Google Gemini API

Use Gemini through the backend only.

The frontend must not directly expose the Gemini API key.

Architecture:

```text
React
  ↓
Spring Boot
  ↓
AI Context Builder
  ↓
Gemini API
```

---

## 17.8 Notifications

### MVP

- In-app notifications
- Web Push API

### Optional Later

- Email notifications

Recommended browser push implementation:

- Service Worker
- Web Push protocol
- Backend notification service

---

## 17.9 Deployment

### Recommended

| Layer | Technology |
|---|---|
| Frontend | Vercel / Cloudflare Pages |
| Backend | Docker container |
| Database | Managed PostgreSQL with PostGIS |
| Cache | Managed Redis |
| CI/CD | GitHub Actions |

### Development Environment

Use Docker Compose:

```text
docker-compose
├── backend
├── postgres-postgis
├── redis
└── optional monitoring
```

---

# 18. Final Recommended Stack

```text
FRONTEND
React + TypeScript + Vite
Tailwind CSS + shadcn/ui
TanStack Query + Zustand
MapLibre GL JS
Recharts

BACKEND
Java 21
Spring Boot 3.x
Spring Web
Spring Data JPA
Spring Security + JWT
Spring Scheduler
WebClient
SSE

DATABASE
PostgreSQL
PostGIS

CACHE
Redis

AI
Google Gemini API

MAP DATA
OpenStreetMap
MapLibre-compatible tile provider

REAL-TIME
Server-Sent Events

NOTIFICATIONS
Web Push API
In-app notifications

DEVOPS
Docker + Docker Compose
GitHub Actions

DEPLOYMENT
Vercel/Cloudflare Pages
Docker backend
Managed PostgreSQL + PostGIS
Managed Redis
```

---

# 19. Data Model (Initial)

## User

```text
User
----
id
name
email
password_hash
role
created_at
updated_at
```

---

## SavedLocation

```text
SavedLocation
-------------
id
user_id
name
latitude
longitude
geometry
created_at
```

---

## DisasterEvent

```text
DisasterEvent
-------------
id
type
title
severity
status
source
source_event_id
event_time
geometry
affected_area
metadata_json
created_at
updated_at
```

---

## DisasterSourceRecord

```text
DisasterSourceRecord
--------------------
id
disaster_event_id
source
external_id
raw_payload
fetched_at
```

---

## RiskAssessment

```text
RiskAssessment
--------------
id
user_id
location_id
disaster_event_id
risk_level
reason
calculated_at
```

---

## AlertPreference

```text
AlertPreference
---------------
id
user_id
location_id
disaster_type
radius_km
minimum_severity
language
notification_channel
```

---

## Notification

```text
Notification
------------
id
user_id
disaster_event_id
risk_level
title
message
status
created_at
```

---

## AssistanceResource

```text
AssistanceResource
------------------
id
name
category
address
geometry
source
verification_status
updated_at
```

---

# 20. API Design (Initial)

## Disaster APIs

```http
GET /api/disasters
GET /api/disasters/{id}
GET /api/disasters/active
GET /api/disasters/nearby
```

### Filters

```text
type
severity
status
latitude
longitude
radius
```

---

## Risk APIs

```http
POST /api/risk/assess
GET  /api/risk/my-locations
```

---

## Location APIs

```http
GET    /api/locations
POST   /api/locations
PUT    /api/locations/{id}
DELETE /api/locations/{id}
```

---

## Alert APIs

```http
GET    /api/alerts/preferences
POST   /api/alerts/preferences
PUT    /api/alerts/preferences/{id}
DELETE /api/alerts/preferences/{id}

GET    /api/notifications
```

---

## Assistance APIs

```http
GET /api/assistance/nearby
```

---

## Analytics APIs

```http
GET /api/analytics/overview
GET /api/analytics/trends
GET /api/analytics/distribution
```

---

## AI APIs

```http
POST /api/ai/guidance
```

The backend should build the AI context rather than accepting arbitrary disaster facts from the client.

---

# 21. Frontend Pages

## 1. Landing Page

- Product overview
- Active disaster summary
- Map preview
- Call to action

---

## 2. Global Dashboard

Primary application screen.

Contains:

- Interactive map
- Disaster filters
- Active event list
- Severity indicators
- Event details panel

---

## 3. Disaster Details Page

Displays:

- Disaster type
- Location
- Severity
- Event time
- Source information
- Affected region
- Timeline
- Official references
- AI guidance

---

## 4. My Locations

Users can:

- Add locations
- Delete locations
- View current risk

---

## 5. Alerts & Preferences

Configure:

- Disaster categories
- Radius
- Severity threshold
- Notification preference
- Language

---

## 6. Nearby Assistance

Map/list view of:

- Hospitals
- Shelters
- NGOs
- Relief centers

---

## 7. Research Dashboard

Includes:

- Historical charts
- Geographic analysis
- Disaster frequency
- Time-based trends

---

## 8. Admin Dashboard

Optional for MVP.

Includes:

- Data source health
- Recent ingestion jobs
- Failed ingestion attempts
- Event counts

---

# 22. Non-Functional Requirements

## Performance

- Cached active-disaster APIs should respond quickly under normal load.
- Map rendering should remain usable with large event datasets.
- Historical data should use pagination or aggregation.

## Reliability

- External API failures should be isolated.
- Failed ingestion jobs should be logged.
- Retry policies should use exponential backoff where appropriate.

## Security

- API keys stored only in environment variables or secret managers.
- Passwords hashed securely.
- Protected endpoints require authentication.
- Rate limiting for sensitive APIs.
- Input validation on all public APIs.

## Privacy

- Location permission must be explicit.
- Users can delete stored locations.
- Exact location should not be retained unnecessarily.

## Accessibility

- Keyboard navigation.
- Semantic HTML.
- Severity must not be communicated using color alone.
- Clear emergency disclaimers.

---

# 23. MVP Scope

The capstone MVP should focus on **doing fewer things reliably rather than integrating every possible disaster source**.

## Phase 1 — Foundation

- Project setup
- Authentication
- PostgreSQL + PostGIS
- Basic React dashboard
- Global map

---

## Phase 2 — Disaster Monitoring

Integrate a limited number of high-value data sources.

Target categories:

- Earthquakes
- Wildfires
- Severe weather/cyclones
- Floods where reliable data is available

Features:

- Data ingestion
- Normalization
- Storage
- Active disaster map

---

## Phase 3 — Risk Engine

- Saved locations
- Geospatial queries
- Distance calculations
- Point-in-polygon analysis
- Safe / Monitoring / Warning / High Risk classification

---

## Phase 4 — Alerts

- Alert preferences
- In-app notifications
- Web push

---

## Phase 5 — AI Guidance

- Gemini integration
- Structured context generation
- Safety-focused response templates
- Official disclaimer

---

## Phase 6 — Nearby Assistance

- Nearby hospitals
- Emergency resources
- Map integration

---

## Phase 7 — Analytics

- Historical data
- Trend charts
- Region/type analysis

---

# 24. Stretch Features

Only implement after the MVP is stable.

## Disaster Path Forecasting

Display trajectories provided by authoritative sources.

Do not present internally generated forecasts as authoritative unless supported by validated models.

---

## Community Reports

Users may submit observations.

Requirements:

- Clearly label as unverified.
- Never merge automatically with verified disaster events.
- Include moderation or trust mechanisms.

---

## "I'm Safe" Notifier

Users can notify selected contacts that they are safe.

Potential implementation:

- Email
- Shareable status link

---

## Offline Emergency Information

Progressive Web App functionality could cache:

- Basic emergency guidance
- Emergency contacts
- Recently viewed information

---

## Satellite and GIS Overlays

Potential layers:

- Satellite imagery
- Weather radar
- Flood zones
- Fire boundaries

---

# 25. Key Technical Decisions

## Decision 1 — Modular Monolith over Microservices

### Choice
Spring Boot modular monolith.

### Reason
Microservices would significantly increase deployment and debugging complexity without providing meaningful capstone value at the initial scale.

---

## Decision 2 — PostGIS as Core Geospatial Engine

### Choice
PostgreSQL + PostGIS.

### Reason
The project's core differentiator is location-aware disaster intelligence. Geospatial processing should therefore be handled directly by the database.

---

## Decision 3 — Deterministic Risk Engine

### Choice
Rule-based risk assessment.

### Reason

- Explainable
- Testable
- Auditable
- Safer for an emergency-information context

---

## Decision 4 — AI as Guidance Layer

### Choice
Gemini explains verified data.

### Reason

The AI model should not become a single point of failure for disaster detection or risk classification.

---

## Decision 5 — SSE before WebSockets

### Choice
Server-Sent Events for MVP.

### Reason

Most real-time updates are server → client, making SSE simpler and sufficient.

---

# 26. Success Metrics

The capstone can be evaluated using:

## Functional

- Number of supported disaster categories
- Number of integrated data sources
- Successful ingestion rate
- Duplicate detection accuracy
- Risk assessment response time

## User Experience

- Time required to identify nearby hazards
- Time required to locate assistance
- Clarity of risk explanations

## Technical

- API latency
- Data ingestion reliability
- System uptime during demonstration
- Test coverage of the risk engine

---

# 27. Testing Strategy

## Backend

- Unit tests for risk calculations
- Unit tests for normalization
- Integration tests for APIs
- Repository tests for PostGIS queries

## Frontend

- Component tests
- API integration tests
- User-flow testing

## Critical Scenarios

Test:

1. User inside an affected polygon.
2. User near but outside the affected area.
3. High-severity event at a distance.
4. Multiple duplicate reports from different sources.
5. External source failure.
6. Invalid coordinates.
7. Risk level change.
8. Notification deduplication.

---

# 28. Risks and Mitigation

| Risk | Mitigation |
|---|---|
| External API changes | Adapter-based ingestion architecture |
| Data inconsistency | Validation and normalization layer |
| Duplicate events | Spatial and temporal correlation |
| AI hallucination | Structured context and constrained prompts |
| Incorrect interpretation of risk | Explainable deterministic rules + clear disclaimer |
| Too many features | Strict MVP scope |
| Map performance | Clustering and spatial filtering |
| Location privacy | Explicit permission and minimal retention |

---

# 29. Suggested Repository Structure

```text
disasterwatch/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── features/
│   │   │   ├── disasters/
│   │   │   ├── map/
│   │   │   ├── alerts/
│   │   │   ├── risk/
│   │   │   └── analytics/
│   │   ├── pages/
│   │   ├── services/
│   │   └── store/
│
├── backend/
│   └── src/main/java/com/disasterwatch/
│       ├── auth/
│       ├── disaster/
│       ├── ingestion/
│       ├── risk/
│       ├── alerts/
│       ├── assistance/
│       ├── analytics/
│       └── ai/
│
├── infrastructure/
│   ├── docker/
│   └── docker-compose.yml
│
├── docs/
│   ├── prd.md
│   ├── architecture.md
│   └── api-spec.md
│
└── README.md
```

---

# 30. Recommended Development Priority

## Must Have

1. Multi-source disaster ingestion
2. Validation and normalization
3. PostgreSQL + PostGIS
4. Interactive global map
5. Disaster filtering
6. Saved user locations
7. Deterministic risk engine
8. Clear risk levels
9. Gemini safety guidance
10. Basic nearby assistance
11. Historical analytics

## Should Have

- Web push alerts
- Data source health monitoring
- Advanced deduplication
- Multiple saved locations
- Official guidance integration

## Could Have

- Community reports
- Offline mode
- "I'm Safe" notifier
- Satellite overlays
- Advanced forecasting

---

# 31. Final Product Definition

**DisasterWatch is a real-time global disaster intelligence platform that aggregates verified disaster information, visualizes events through an interactive map, evaluates location-based risk using deterministic geospatial rules, delivers personalized alerts, provides AI-assisted safety guidance, and helps users discover nearby emergency resources.**

The project is designed around a clear separation of responsibilities:

```text
External Sources
      ↓
Verified Disaster Data
      ↓
Validation + Normalization
      ↓
PostGIS + Risk Engine
      ↓
Risk Classification
      ↓
Alerts + Dashboard
      ↓
Gemini Explanation & Guidance
```

> **The system detects and evaluates. AI explains and assists. Official authorities remain the source of emergency instructions.**

---

# 32. Final Stack Recommendation

For the strongest combination of **capstone feasibility, modern development practices, GIS capability, and scalability**, use:

> **React + TypeScript + MapLibre GL JS + Java 21 + Spring Boot + PostgreSQL + PostGIS + Redis + SSE + Google Gemini + Docker**

This stack keeps the project's strongest differentiator—**geospatial disaster intelligence**—at the center while avoiding unnecessary microservice complexity.

---

**End of PRD**

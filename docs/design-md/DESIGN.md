# Design System: AegisWatch — Orbital Telemetry & Crisis Operations

**Project ID:** _local synthesis_ — this repo has no Stitch project linked in the workspace, so this document was synthesized from the real token sources of truth rather than a live Stitch project:
`frontend/tailwind.config.js`, `frontend/src/app/globals.css`, `docs/Design.md`, and `references/stitch-design-explorations/orbital_telemetry_crisis_operations/DESIGN.md`.

> This file is the canonical design language for AegisWatch. Treat it as the source of truth when prompting Stitch (or any design tool) to generate new screens, and keep it in sync whenever `tailwind.config.js` changes.

---

## 1. Visual Theme & Atmosphere

AegisWatch embodies **mission-control brutalism under pressure** — the visual language of an aerospace flight deck, a seismological watch-floor, and an orbital defense terminal fused into a single dark console. The atmosphere is **cold, high-density, and relentlessly legible**. Nothing is decorative for its own sake; every surface, border, and glyph exists to shorten the distance between a raw hazard signal and an operator's decision.

The mood is **composed urgency**. Information presses forward through **tonal stratification** — layered near-black decks separated by razor-thin hairlines — rather than through soft shadows or ambient blur. Motion is sparse and purposeful: a beacon pings, a status dot breathes, a feed ticker glides. Silence is the default; movement signals that something is *live*.

**Key Characteristics**
- Void-black canvas (#0F131C) with six discrete surface elevations, never more than ~12 % lighter than the canvas.
- Structural definition from 1px hairline borders (#3D494C / #1F2937) instead of drop shadows.
- Cyan is *operational*, not decorative — reserved for live/healthy state and primary action.
- Hazard color is semantic and never reused as brand accent: crimson = critical, amber = advisory, cyan-blue = hydrological, emerald = nominal.
- Tabular monospace for every number that can change without a layout shift.
- Dense data, generous hierarchy: small type in tightly packed modules, bold display type for the one number that matters.

---

## 2. Color Palette & Roles

### Foundation Surfaces (the dark void, darkest → lightest)
- **Void Black** (`#0F131C`) — the primary application canvas and the optical reference for every other surface. Feels infinite; the map and feed float on it.
- **Deep Space Rail** (`#0A0E16`) — the darkest deck; used for the persistent header, the docked navigation rail, and the map frame so chrome recedes behind content.
- **Sub-Surface Deck** (`#181C24`) — the workhorse card background for incident tiles and metric widgets.
- **Console Base** (`#1C2028`) — base state for interactive panels and filter pills; one step up from a resting card.
- **Active Module** (`#262A33`) — hover/selected card state, focused inputs, tooltips, flyout drawers.
- **Elevated Panel** (`#31353E`) — chip fills, secondary button fills, dividers; the lightest structural tone before text.
- **Bright Deck** (`#353942`) — the highest modal/overlay elevation, used sparingly so modals read as physically above the deck.

### Text & Contrast
- **Signal White** (`#DFE2EE`) — primary text, headings, and the bold telemetry figures. Slightly blue-cooled so it reads crisp against the navy-black rather than harsh.
- **Muted Telemetry** (`#BCC9CD`) — secondary body copy, metric labels, elapsed-time strings.
- **Instrument Grey** (`#869397`) — tertiary metadata, inactive icons, unit suffixes; recedes but stays readable.
- **Hairline Structure** (`#3D494C`) — borders and separators only; never used as a fill or for text.

### Operational & Hazard Semantics
- **Operational Cyan** (`#4CD7F6`) — the primary accent. Marks live/healthy systems, active sensor paths, radar beacons, and the single most important interactive element on a screen. Paired container: `#06B6D4`, with `#003640` as its label color for filled buttons.
- **Critical Crimson** (`#FFB3AD` label / `#A40217` container / `#EF4444` alert) — Level-1 severe events: high-magnitude quakes, category 4–5 cyclones, active uncontrolled fires, tsunami warnings. Used for the unread bell badge and the "critical" status stripe.
- **Advisory Amber** (`#FFB95F` / tertiary, container `#E79400`) — watches, advisories, escalating feeds, degraded uplinks. The "significant but not yet catastrophic" tier.
- **Hydrological Blue** (`#38BDF8`) — reserved for floods and inundation so water data is instantly distinguishable from cyan system chrome.
- **Nominal Emerald** (`#10B981`) — healthy baselines and resolved incidents; used with restraint so it never competes with operational cyan.

### Semantic Mapping Rules
| Domain | Stripe / Marker | Meaning |
|---|---|---|
| Earthquake | `#C2692A` (earth brown) | Geological events; magnitude drives weight |
| Wildfire | `#DC2626` → `#F59E0B` → `#8B949E` | Severity-tiered: critical → significant → monitored |
| Cyclone | `#C084FC` (violet) | Meteorological storms |
| Flood | `#38BDF8` (hydrological blue) | Inundation and crest warnings |
| Tsunami | `#FFB95F` (advisory amber) | Coastal threat advisories |
| Volcano | `#FFB4AB` (error) | Eruption events |

---

## 3. Typography Rules

The system runs a deliberate **dual-engine hierarchy**, and the split is meaningful, not decorative.

**Analytical Engine — JetBrains Mono.** Every value that streams or could change width without warning: coordinates, UTC timestamps, magnitudes, focal depths, wind speeds, crest heights, event counts. Always set with `tabular-nums` so a live feed never jitters horizontally. Mono is the sound of instrument readout.

**Structural Engine — Plus Jakarta Sans (display) + Inter (body).** Headlines use Plus Jakarta Sans at heavy weights (700–800) with tightened tracking (`-0.01em` to `-0.02em`), giving command-heading authority. Body copy uses Inter at 400 for calm, wide legibility. The pairing signals "editorial headline over technical instrument panel."

**Type Scale**
| Token | Family | Size / Line | Weight | Tracking | Role |
|---|---|---|---|---|---|
| `headline-xl` | Plus Jakarta Sans | 40 / 48 | 800 | -0.02em | Hero/primary KPI numbers |
| `headline-lg` | Plus Jakarta Sans | 32 / 40 | 700 | -0.02em | Page and section titles |
| `headline-md` | Plus Jakarta Sans | 22 / 28 | 700 | -0.01em | Metric counts, modal titles |
| `headline-sm` | Plus Jakarta Sans | 18 / 24 | 600 | 0 | Card titles, panel headers |
| `body-lg` | Inter | 16 / 24 | 400 | 0 | Long-form summaries, guidance |
| `body-md` | Inter | 14 / 20 | 400 | 0 | Standard UI copy, navigation |
| `body-sm` | Inter | 12 / 16 | 400 | 0 | Subtitles, helper text |
| `label-mono-lg` | JetBrains Mono | 14 / 20 | 600 | +0.05em | Magnitudes, severity readouts |
| `label-mono-md` | JetBrains Mono | 12 / 16 | 500 | +0.04em | Coordinates, status chips |
| `label-mono-sm` | JetBrains Mono | 10 / 14 | 500 | +0.06em | Micro-badges, UTC stamps |

**Rules:** uppercase + letter-spacing for all instrument labels; never uppercase `body-lg`; never use mono for a full sentence.

---

## 4. Component Stylings

### Buttons
- **Shape:** restrained, precision-machined corners — the base radius is `0.125rem` (2px) with `0.25rem` (4px) as the standard for buttons and inputs. Notably, this system **avoids pill buttons** except for status/filter chips; the angularity is intentional.
- **Primary Operational:** operational cyan fill (`#06B6D4` / `#4CD7F6`) with near-black label (`#003640`), bold. Hover brightens toward `#22D3EE` with a whisper cyan glow.
- **Ghost / Sensor Toggle:** translucent dark fill, 1px hairline (`#3D494C`), hover border lightens.
- **Critical Action:** crimson fill with white label; hover deepens to `#DC2626`.

### Cards & Containers
- **Corner character:** "subtly rounded" — `0.5rem` (8px) is the standard card radius, `0.75rem` (12px) for the large map frame. Never bubbly.
- **Surface:** Sub-Surface Deck (`#181C24`) at rest, Active Module (`#262A33`) on hover/selection.
- **Border:** 1px hairline `#3D494C` at rest; the selected card gains a cyan-tinted ring plus a faint cyan shadow bloom.
- **Severity stripe:** a 3px accent line on the left edge carries severity pre-attentively (crimson / amber / cyan).
- **Numerals in cards** are mono + tabular so a list of live metrics stays column-aligned.

### Inputs & Forms
- Dark inset field (`#0A0E16`–`#181C24`), 1px hairline border, generous padding (`0.75rem`), "gently curved" `0.5rem` radius.
- **Focus:** border transitions to operational cyan with a 1px cyan ring — the only place cyan is used purely for focus.
- Placeholder text is muted instrument grey; disabled fields reduce opacity and read as non-interactive.

### Chips, Badges & Status
- **Pill-shaped** (the one exception to the angular rule) with a tinted wash: crimson `rgba(239,68,68,0.15)`, amber `rgba(245,158,11,0.15)`, cyan `rgba(6,182,212,0.12)`.
- Mono, uppercase, tight micro-type; paired with a pulsing beacon dot to signal *live*.

### Map & Telemetry Overlays
- **Beacon markers:** a solid ~12px core dot plus an animated ping ring (`beacon-ping`, 2.2s cubic-bezier infinite). Core color is hazard-coded and, for wildfire, **severity-tiered** (critical red → significant amber → monitored grey).
- **Coordinate HUD:** corner widget in `label-mono-sm`, tabular, showing LAT / LNG / ZOOM.
- **Tooltips:** dark glass panel (`rgba(13,17,23,0.95)`, hairline border, `backdrop-blur`), max-width capped with ellipsis to avoid map occlusion.

### Motion Signature
- Beacons ping at 2.2s; status dots breathe at ~2s; nothing animates faster than ~150ms on interaction.
- Ambient motion (background aura, pulsing indicators) is **paused under `prefers-reduced-motion`**.
- Transitions are short (150–250ms) and mostly color/opacity; transforms are reserved for emphasis (hover scale ≤ 1.05).

---

## 5. Layout Principles

- **4px sub-grid.** Every spacing value is a multiple of 0.25rem, giving the density its mathematical rhythm.
- **Token scale:** `gutter-xs` 4px · `gutter-sm` 8px · `gutter-md` 12px · `gutter-lg` 16px · `module-gap` 20px · `panel-padding-standard` 16px · `panel-padding-spacious` 24px · `grid-margin-desktop` 24px · `grid-margin-mobile` 12px.
- **Desktop frame:** a fixed 16rem (256px) left navigation rail, a fixed 64px command header, and a fluid main canvas capped at `1600px` and centered.
- **Vertical staging:** a persistent split of "situational map + KPI metrics" above, and "incident command stream" below, so the map never scrolls away from the numbers that explain it.
- **Mobile reflow (`< 768px`):** the rail collapses into a slide-over drawer reached from a header hamburger; grid margins drop to 16px; KPI tiles go 2-up; the incident stream becomes a single full-width column with no nested scroll; modals become scrollable sheets that respect the viewport height (`items-start` + `my-auto`).
- **Whitespace philosophy:** none is "empty" — it is reserved headroom that lets hairlines and beacons carry structure. Density is high but never crowded, because separation comes from tonal steps, not gaps.
- **Elevation philosophy:** depth is expressed by **which deck you are on** and by hairline borders, not by shadow spread. Only hazard bloom and cyan selection rings are permitted luminous exceptions.

---

## 6. Voice & Data Honesty (product-level rules)

These are part of the design contract, not just copy:
- Every risk surface carries the civil-protection disclaimer; the platform never impersonates an authority.
- Empty states are **honest**: "no live events in this region right now" rather than a filler placeholder.
- Severity is always labeled, never implied by color alone (accessibility + trust).
- No fabricated AI authority: any automated guidance must be labeled as such.

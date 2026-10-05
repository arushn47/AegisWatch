---
name: Orbital Telemetry & Crisis Operations
colors:
  surface: '#0f131c'
  surface-dim: '#0f131c'
  surface-bright: '#353942'
  surface-container-lowest: '#0a0e16'
  surface-container-low: '#181c24'
  surface-container: '#1c2028'
  surface-container-high: '#262a33'
  surface-container-highest: '#31353e'
  on-surface: '#dfe2ee'
  on-surface-variant: '#bcc9cd'
  inverse-surface: '#dfe2ee'
  inverse-on-surface: '#2c3039'
  outline: '#869397'
  outline-variant: '#3d494c'
  surface-tint: '#4cd7f6'
  primary: '#4cd7f6'
  on-primary: '#003640'
  primary-container: '#06b6d4'
  on-primary-container: '#00424f'
  inverse-primary: '#00687a'
  secondary: '#ffb3ad'
  on-secondary: '#68000a'
  secondary-container: '#a40217'
  on-secondary-container: '#ffaea8'
  tertiary: '#ffb95f'
  on-tertiary: '#472a00'
  tertiary-container: '#e79400'
  on-tertiary-container: '#563400'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#acedff'
  primary-fixed-dim: '#4cd7f6'
  on-primary-fixed: '#001f26'
  on-primary-fixed-variant: '#004e5c'
  secondary-fixed: '#ffdad7'
  secondary-fixed-dim: '#ffb3ad'
  on-secondary-fixed: '#410004'
  on-secondary-fixed-variant: '#930013'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#0f131c'
  on-background: '#dfe2ee'
  surface-variant: '#31353e'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '800'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-mono-lg:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-mono-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.04em
  label-mono-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.06em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  grid-margin-desktop: 1.5rem
  grid-margin-mobile: 0.75rem
  gutter-xs: 0.25rem
  gutter-sm: 0.5rem
  gutter-md: 0.75rem
  gutter-lg: 1rem
  module-gap: 1.25rem
  panel-padding-tight: 0.5rem
  panel-padding-standard: 1rem
  panel-padding-spacious: 1.5rem
---

## Brand & Style

This design system delivers an uncompromising tactical environment engineered for planetary monitoring, disaster coordination, and high-velocity crisis triage. The design style combines technical **Brutalism** with refined **High-Contrast Dark Mode** principles: strictly organized, hyper-dense, mathematically grounded, and stripped of ornamental distraction. 

Every pixel serves operational utility. The aesthetic channels aerospace mission control rooms, orbital satellite relays, and seismic watch-floors. The interface evokes calculated composure under pressure, complete situational clarity, and rapid situational awareness. Visual noise is aggressively suppressed so that status anomalies, threat thresholds, and real-time hazard vectors command immediate optical priority.

## Colors

The palette operates on a strict functional stratification optimized for prolonged situational watch in low-light tactical environments:

- **Deep Space Foundations**: `#0B0F17` (Void Black) serves as the primary canvas anchor, while `#111827` (Obsidian Navy) and `#1F2937` (Sub-surface Deck) represent operational consoles, modular docks, and data containers.
- **Structural Framing**: Borders leverage `#1F2937` for subdued container definition and `#374151` for active or focused telemetry modules.
- **Primary Operational Accent (Cyan / Electric Blue `#06B6D4`)**: Reserved for system-wide nominal actions, active sensor paths, radar pings, and telemetry monitoring conduits.
- **Secondary Alert Tier (Crimson Red `#EF4444`)**: Dictates Level 1 Severe/Critical emergencies—tsunamis, high-magnitude quakes, flash fires, immediate evacuation vectors, and hard overrides.
- **Tertiary Alert Tier (Amber / Orange `#F59E0B`)**: Signals Watch/Advisory thresholds, system warnings, escalating sensor feeds, and degraded asset uplinks.
- **System Stability (Emerald Green `#10B981`)**: Denotes normal baselines, resolved incidents, verified ground truth signals, and healthy data streams.
- **Data Readout Contrast**: Pure `#F9FAFB` for primary high-contrast metrics, `#9CA3AF` for analytical labels, and `#4B5563` for baseline coordinates and secondary metric units.

## Typography

The typographic hierarchy implements an asymmetric dual-engine design:

1. **Analytical Data Engine (`JetBrains Mono`)**: Strict tabular alignment across all real-time telemetry: geo-coordinates (Lat/Long/Alt), UTC microsecond clocks, Richter scale magnitudes, decibel shifts, and raw system payloads. Tabular figures (`tnum`) prevent layout jitter during rapid-fire stream updates.
2. **Structural & Editorial Hierarchy (`Plus Jakarta Sans` & `Inter`)**: Clean geometric line-weights eliminate ambiguity during emergency decision cycles. Incident debriefs, alert titles, and situation overviews leverage high contrast weight pairings (`700` and `800`) to guarantee legibility across low-resolution monitor arrays and mobile field tablets.

## Layout & Spacing

The system runs on a high-density, screen-edge-conscious **Fluid Module Grid** designed for zero wasted real estate:

- **Grid Framework**: 12-column adaptive layout on desktop (`>= 1280px`), collapsible into dynamic dockable split-screens (25% Telemetry Feed, 50% Geographic Heatmap/Vector Engine, 25% Incident Command Stream). Transitions to an 8-column layout on tablet (`768px - 1279px`) and a singular, vertical stacked rail on mobile (`< 768px`).
- **Density Tiers**: Component internals operate on a strict 4px sub-grid (`0.25rem` multipliers). Data feeds employ compact padding (`0.5rem`) to maximize simultaneous visible events per viewport without requiring destructive scroll behavior.
- **Reflow Protocols**: Map viewports remain persistent as background anchors or split-screen mainstages; side panels slide over as non-blocking sheets on tablet and full-screen swipeable cards on mobile viewports.

## Elevation & Depth

This system avoids soft, unfocused ambient drop shadows that dilute tactical data legibility. Depth is communicated strictly via **Tonal Stratification and Structural Edge Definition**:

- **Ground Zero (`#0B0F17`)**: Global satellite basemaps, radar canvas, and structural application gutters.
- **Level 1 Panels (`#111827` + 1px border `#1F2937`)**: Mission dashboards, alert log panels, and stream feeds.
- **Level 2 Modules & Flyouts (`#161E2E` + 1px border `#374151`)**: Active sensor inspectors, contextual metric tooltips, and interactive filter switches.
- **Emergency Overlays & HUD Alerts**: Pure backdrop-blur isolation (`backdrop-filter: blur(12px)`) layered over a 70% opacity `#0B0F17` scrim, bounded by high-contrast directional hazard borders (e.g., 2px solid `#EF4444` for active critical incidents).
- **Hazard Bloom**: Critical alerts may project an intentional, controlled luminescent outer glow (`box-shadow: 0 0 16px rgba(239, 68, 68, 0.35)`) to immediately direct operational attention during catastrophic status shifts.

## Shapes

Shapes reflect precision-machined instrument ergonomics:

- All cards, badges, and layout panels feature compact, crisp corner radii (maximum `0.25rem` / `4px`), retaining an industrial, utilitarian silhouette.
- Active state indicators, status markers, and radar blips utilize absolute geometric primitives: perfect squares for synthetic sensor nodes, perfect circles for seismic epicenters, and diamond badges for early warning triggers.
- Buttons and inputs mirror this restrained angularity (`0.25rem`), eliminating pill-shaped or overly rounded components to reinforce the mission-critical tone.

## Components

### Buttons & Tactical Triggers
- **Primary / Actionable**: `#06B6D4` background, `#0B0F17` bold typography, `0.25rem` radius. Interactive state: `#22D3EE` with a razor-thin cyan glow (`0 0 8px rgba(6, 182, 212, 0.4)`).
- **Critical Action (Scram / Evacuate / Broadcast)**: High-contrast `#EF4444` with `#FFFFFF` label text. On hover: shifts to `#DC2626` with pulsing warning ring.
- **Ghost / Sensor Toggles**: Translucent background (`rgba(17, 24, 39, 0.6)`), 1px solid border `#1F2937`, hover-border `#374151`.

### Data Stream Chips & Threat Badges
- Constructed with `label-mono-sm` JetBrains Mono text for fast scanning.
- **Severe / Critical**: Red wash (`rgba(239, 68, 68, 0.15)`), solid border `#EF4444`, text `#FCA5A5`, coupled with an animated pulse dot indicator.
- **Warning / Alert**: Amber wash (`rgba(245, 158, 11, 0.15)`), border `#F59E0B`, text `#FCD34D`.
- **Nominal / Telemetry**: Cyan wash (`rgba(6, 182, 212, 0.12)`), border `#06B6D4`, text `#67E8F9`.

### Incident Cards & Data Modules
- Background `#111827`, hairline 1px border `#1F2937`.
- Metric blocks display monospace parameter labels (`#9CA3AF`) directly above bold tabular figures (`#F9FAFB`).
- Severity status is indicated along the entire left border edge using a distinct 3px colored accent stripe (Red, Amber, Cyan, or Emerald).

### Input Fields & Search Bars
- Background `#0B0F17`, 1px border `#1F2937`, text `#F9FAFB`. 
- Focus state: Border transitions to `#06B6D4`, accompanied by an inner cyan outline. Placeholder values use muted monospaced text (`JetBrains Mono`, `#4B5563`).

### Checkboxes & Toggle Switches
- Checkboxes: Square with `2px` micro-radius, background `#0B0F17`, border `#374151`. Active selection features a solid `#06B6D4` fill with obsidian `#0B0F17` iconography.
- Telemetry Toggles: Segmented rectangular step-switches displaying explicit binary labels (`ON` / `OFF` or `ACTV` / `STBY`) in monospaced font.

### Specialized Mission Control Components
- **Seismic Waveform Scrubber**: Darkened timeline rail with horizontal threshold markers and peak indicators rendered in `#EF4444`.
- **Coordinate Telemetry HUD**: Persistent corner widget displaying cursor viewport Lat/Long coordinates and elevation in `label-mono-sm` with zero anti-aliasing fuzziness.
- **Threat Escalation Matrix**: High-density grid presenting color-coded risk vectors (Geological, Meteorological, Hydrological, Atmospheric) with immediate status switches.
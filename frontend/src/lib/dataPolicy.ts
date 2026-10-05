import type { DisasterEvent, DisasterSeverity, DisasterType } from '../types/disaster';

/**
 * FEED FRESHNESS POLICY — what stays in the dashboard.
 *
 * Upstream feeds mix together events that are minutes old with records that
 * have been "open" for months (NASA EONET keeps a drought event alive for as
 * long as the region is dry, so the feed happily showed "257d ago"). This
 * policy is the single choke point that decides what a user actually sees.
 * Every surface — map, incident list, KPIs, sidebar counts, notification
 * fallback — renders from the filtered result, so the whole app shares one
 * definition of "recent and impacting".
 *
 * Three rules, applied in order:
 *
 * 1. FRESHNESS WINDOW — each hazard type has a retention window. An event
 *    older than its window is dropped, no matter how it is labelled
 *    upstream. Slow-onset hazards (drought, epidemic, volcano) get longer
 *    windows than impulse hazards (quake, tsunami, wildfire).
 *
 * 2. PER-TYPE CAP — each hazard type keeps at most N events. Selection
 *    inside the cap is severity-first ("impacting"), recency-second, so a
 *    M6.5 quake from 4 days ago is not crowded out by thirty M2.8 records
 *    from this morning. Display order stays recency-based.
 *
 * 3. GLOBAL CAP — the merged feed is capped in total so the map marker
 *    layer and lists stay responsive no matter how noisy the sources are.
 *
 * Future-dated records are dropped too (clock skew guard), because a "happens
 * tomorrow" event is a data error, not an alert.
 */

const DAY_MS = 86_400_000;

/** Retention window per hazard type, in days. */
export const FRESHNESS_WINDOW_DAYS: Record<DisasterType, number> = {
  // Rapid impulse hazards: acute threat window is 24–72 hours
  TSUNAMI: 2, // Waves cross oceans in hours; 48 hours is standard cancellation window
  TORNADO: 2, // Local convective vortex passes in minutes to hours
  AVALANCHE: 3, // Snowpack instability peak
  SOLAR_STORM: 3, // Coronal mass ejection passes Earth in 1-3 days
  EARTHQUAKE: 7, // Ceiling for significant aftershocks; minor quakes are 2 days

  // Multi-day dynamic weather and hydrological hazards
  BLIZZARD: 7, // Winter storm tracking
  HEATWAVE: 10, // Sustained synoptic temperature anomaly
  LANDSLIDE: 10, // Post-storm slope stability
  CYCLONE: 14, // Full tropical system lifecycle from depression to dissipation
  WILDFIRE: 21, // Major wildland fire perimeters burn for weeks
  FLOOD: 21, // Riverine flood wave transit & water recession

  // Slow-onset, chronic hazards
  VOLCANO: 30, // Eruptive phase, ash fall & lahar hazards
  DROUGHT: 45, // Severe agricultural & hydrological deficit
  EPIDEMIC: 60, // Multi-week epidemiological surveillance
};

const DEFAULT_WINDOW_DAYS = 14;

/**
 * Returns dynamic freshness window in days, accounting for event magnitude and scale.
 * - Minor quakes (< M5.0): 2 days (prevents sensor noise)
 * - Significant quakes (M5.0+): 7 days (active aftershock hazard)
 * - Major wildfires (CRITICAL or >= 5,000 acres): 21 days; smaller fires: 7 days
 */
export function getFreshnessWindowDays(event: DisasterEvent): number {
  if (event.type === 'EARTHQUAKE') {
    const mag = Number(event.metrics?.magnitude) || 0;
    return mag >= 5.0 || event.severity === 'CRITICAL' || event.severity === 'HIGH' ? 7 : 2;
  }
  if (event.type === 'WILDFIRE') {
    const acres = Number(event.metrics?.acresBurned) || 0;
    return event.severity === 'CRITICAL' || acres >= 5000 ? 21 : 7;
  }
  return FRESHNESS_WINDOW_DAYS[event.type] ?? DEFAULT_WINDOW_DAYS;
}

/** How many events of each type the dashboard keeps at most. */
export const MAX_EVENTS_PER_TYPE: Record<DisasterType, number> = {
  EARTHQUAKE: 30, // frequent; recency does most of the filtering
  WILDFIRE: 25,
  FLOOD: 25,
  CYCLONE: 15,
  TSUNAMI: 10,
  VOLCANO: 10,
  TORNADO: 15,
  LANDSLIDE: 15,
  HEATWAVE: 12,
  BLIZZARD: 10,
  AVALANCHE: 10,
  SOLAR_STORM: 10,
  DROUGHT: 12, // long-lived; window limits these
  EPIDEMIC: 8,
};

const DEFAULT_MAX_PER_TYPE = 25;

/** Hard ceiling on the merged feed. */
export const GLOBAL_MAX_EVENTS = 140;

/** Records more than 6h in the future are treated as bad data, not alerts. */
const MAX_CLOCK_SKEW_MS = 6 * 60 * 60 * 1000;

const SEVERITY_RANK: Record<DisasterSeverity, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

function eventTimeMs(event: DisasterEvent): number {
  return new Date(event.timestamp).getTime();
}

/**
 * Applies the freshness policy: drops stale/future-dated events based on
 * hazard-specific lifecycles, caps each hazard type (severity-first selection),
 * caps the merged feed, and returns everything sorted most-recent-first for display.
 */
export function applyFreshnessPolicy(events: DisasterEvent[]): DisasterEvent[] {
  const now = Date.now();

  // 1. Freshness window + clock-skew guard using hazard-specific timelines.
  const fresh = events.filter((event) => {
    const t = eventTimeMs(event);
    if (!Number.isFinite(t)) return false;
    if (t - now > MAX_CLOCK_SKEW_MS) return false;
    const windowDays = getFreshnessWindowDays(event);
    return now - t <= windowDays * DAY_MS;
  });

  // 2. Per-type cap — selection is severity-first, then most recent.
  const byType = new Map<DisasterType, DisasterEvent[]>();
  for (const event of fresh) {
    const bucket = byType.get(event.type);
    if (bucket) bucket.push(event);
    else byType.set(event.type, [event]);
  }

  const kept: DisasterEvent[] = [];
  for (const [type, bucket] of byType) {
    const cap = MAX_EVENTS_PER_TYPE[type] ?? DEFAULT_MAX_PER_TYPE;
    if (bucket.length <= cap) {
      kept.push(...bucket);
      continue;
    }
    bucket.sort((a, b) => {
      const sev = SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity];
      if (sev !== 0) return sev;
      return eventTimeMs(b) - eventTimeMs(a);
    });
    kept.push(...bucket.slice(0, cap));
  }

  // 3. Global cap + display order: most recent first.
  kept.sort((a, b) => eventTimeMs(b) - eventTimeMs(a));
  return kept.slice(0, GLOBAL_MAX_EVENTS);
}

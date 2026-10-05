import type {
  DisasterEvent,
  DisasterSeverity,
  DisasterType,
  GlobalSensorStats,
  RegionFocus,
} from '../types/disaster';
import { formatRelativeTime } from '../lib/relativeTime';
import { applyFreshnessPolicy } from '../lib/dataPolicy';
import { normalizeLatitude, normalizeLongitude } from '../lib/geo';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const SEVERITY_ORDER: Record<DisasterSeverity, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

function maxSeverity(a: DisasterSeverity, b: DisasterSeverity): DisasterSeverity {
  return SEVERITY_ORDER[a] >= SEVERITY_ORDER[b] ? a : b;
}

/** Human-readable relative time from a timestamp in ms (shared formatter). */
const formatTimeAgo = formatRelativeTime;

const formatLat = (lat: number) => `${Math.abs(lat).toFixed(1)}°${lat >= 0 ? 'N' : 'S'}`;
const formatLng = (lng: number) => `${Math.abs(lng).toFixed(1)}°${lng >= 0 ? 'E' : 'W'}`;

/**
 * Approximate bounding box for India (including Andaman & Nicobar Islands).
 * Used ONLY as a coordinate-based fallback when a feed does not tag the country.
 * Country tags (ISO3 = IND / ISO2 = IN) are authoritative and always win.
 *
 * This box intentionally excludes Afghanistan (west of ~68°E / north of ~35°N),
 * Pakistan (mostly west of 68°E), and China (east of ~97°E / north of ~35.7°N),
 * so the "South Asia · India" view does not surface events in those countries.
 */
export const INDIA_BBOX = { minLat: 6.5, maxLat: 35.7, minLng: 68.1, maxLng: 97.4 };

export function isWithinIndia(lat: number, lng: number): boolean {
  return (
    lat >= INDIA_BBOX.minLat &&
    lat <= INDIA_BBOX.maxLat &&
    lng >= INDIA_BBOX.minLng &&
    lng <= INDIA_BBOX.maxLng
  );
}

/** True when an event is India-relevant by country tag or coordinates. */
export function isIndiaRelevant(event: DisasterEvent): boolean {
  // Country tags are authoritative: only IND / IN counts as India.
  if (event.countries?.some((c) => /^(ind|in)$/i.test(c.trim()))) return true;
  const [lat, lng] = event.coordinates;
  return isWithinIndia(lat, lng);
}

const INDIA_ISO = new Set(['IND', 'IN']);

function indiaTagFrom(isoCodes: string[]): boolean {
  return isoCodes.some((code) => INDIA_ISO.has(code.toUpperCase()));
}

// ---------------------------------------------------------------------------
// USGS — global earthquakes (past 24h) + South Asia (past 7 days)
// ---------------------------------------------------------------------------
async function fetchUsgsEarthquakes(): Promise<DisasterEvent[]> {
  try {
    const [dayRes, weekRes] = await Promise.all([
      fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson'),
      fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson'),
    ]);

    if (!dayRes.ok) return [];
    const dayData = await dayRes.json();
    const dayFeatures = (dayData.features || []).slice(0, 20);

    // Significant quakes (M4.5+) in the Indian subcontinent / Himalayan belt.
    let regionalFeatures: any[] = [];
    if (weekRes.ok) {
      const weekData = await weekRes.json();
      regionalFeatures = (weekData.features || []).filter((f: any) => {
        const [lng, lat] = f.geometry.coordinates;
        const alreadyInDayList = dayFeatures.some((df: any) => df.id === f.id);
        return isWithinIndia(lat, lng) && !alreadyInDayList;
      });
    }

    const allFeatures = [...dayFeatures, ...regionalFeatures];

    return allFeatures.map((f: any) => {
      const [lng, lat, depth] = f.geometry.coordinates;
      const mag = f.properties.mag || 0;
      const place = f.properties.place || 'Unknown Location';
      const time = f.properties.time;

      let severity: DisasterSeverity = 'LOW';
      if (mag >= 6.0) severity = 'CRITICAL';
      else if (mag >= 5.0) severity = 'HIGH';
      else if (mag >= 4.0) severity = 'MEDIUM';

      const india = isWithinIndia(lat, lng);

      return {
        id: `usgs-${f.id}`,
        type: 'EARTHQUAKE' as const,
        title: `M ${mag.toFixed(1)} - ${place.split('of ').pop() || place}`,
        locationName: place.split('of ').pop() || place,
        region: place,
        coordinates: [lat, lng] as [number, number],
        severity,
        status: 'ACTIVE' as const,
        timestamp: new Date(time).toISOString(),
        timeAgo: formatTimeAgo(time),
        metrics: {
          magnitude: mag,
          depthKm: depth ? Math.round(depth * 10) / 10 : undefined,
          tsunamiAdvisory: mag >= 6.5 ? 'Regional Tsunami Watch Evaluated' : undefined,
        },
        primarySource: 'USGS Real-Time Feed',
        externalUrl: f.properties.url,
        summary: `Seismic tremor of magnitude ${mag.toFixed(1)} located at hypocenter depth of ${depth?.toFixed(1) || '0'}km.`,
        officialAdvisory: mag >= 5.5
          ? 'Civil protection inspection of bridge and masonry structures recommended.'
          : 'Standard seismic event recorded by global seismograph net.',
        isLiveFeed: true,
        sourceFeed: 'usgs',
        isIndiaFocus: india,
      };
    });
  } catch (err) {
    console.warn('Failed to fetch USGS live earthquakes:', err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// NASA EONET — wildfires, severe storms and other open natural events
// ---------------------------------------------------------------------------
const EONET_CATEGORY_MAP: Record<string, DisasterType> = {
  wildfires: 'WILDFIRE',
  severeStorms: 'CYCLONE',
  floods: 'FLOOD',
  volcanoes: 'VOLCANO',
  landslides: 'LANDSLIDE',
  tempExtremes: 'HEATWAVE',
  drought: 'DROUGHT',
  snow: 'BLIZZARD',
};

async function fetchNasaEonetEvents(): Promise<DisasterEvent[]> {
  try {
    const res = await fetch('https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=300');
    if (!res.ok) return [];
    const data = await res.json();
    const rawEvents = data.events || [];

    const events: DisasterEvent[] = [];

    for (const event of rawEvents) {
      if (!event.geometry || event.geometry.length === 0) continue;

      // Extract the most recent tracking point.
      const lastGeom = event.geometry[event.geometry.length - 1];
      if (!Array.isArray(lastGeom.coordinates) || lastGeom.coordinates.length < 2) continue;

      // GeoJSON standard is [longitude, latitude].
      const lng = lastGeom.coordinates[0];
      const lat = lastGeom.coordinates[1];
      if (typeof lat !== 'number' || typeof lng !== 'number') continue;

      const geomDate = lastGeom.date ? new Date(lastGeom.date).getTime() : Date.now();
      const catId = event.categories?.[0]?.id || '';
      const type = EONET_CATEGORY_MAP[catId];
      if (!type) continue; // unmapped category (dustHaze, seaLakeIce, ...)

      const primarySourceId = event.sources?.[0]?.id || 'NASA';
      const externalUrl = event.sources?.[0]?.url || event.link;
      const india = isWithinIndia(lat, lng);

      // Deterministic severity, derived per hazard type from the recorded metric.
      let severity: DisasterSeverity = 'MEDIUM';
      const metrics: Record<string, any> = {};

      if (type === 'WILDFIRE') {
        const acres =
          lastGeom.magnitudeUnit === 'acres' ? lastGeom.magnitudeValue : undefined;
        if (acres && acres >= 10000) severity = 'CRITICAL';
        else if (acres && acres >= 2000) severity = 'HIGH';
        metrics.acresBurned = acres ? Math.round(acres) : undefined;
        metrics.categoryScale = acres ? `${Math.round(acres).toLocaleString()} acres` : 'Active Wildfire';
      } else if (type === 'CYCLONE') {
        const knots = lastGeom.magnitudeUnit === 'kts' ? lastGeom.magnitudeValue : undefined;
        const windSpeedKmh = knots ? Math.round(knots * 1.852) : undefined;
        if (windSpeedKmh && windSpeedKmh >= 150) severity = 'CRITICAL';
        else if (windSpeedKmh && windSpeedKmh >= 100) severity = 'HIGH';
        metrics.windSpeedKmh = windSpeedKmh;
        metrics.categoryScale = knots ? `${knots} kts (${windSpeedKmh} km/h)` : 'Tropical Storm';
      } else {
        metrics.categoryScale = event.categories?.[0]?.title || type;
        if (type === 'VOLCANO') severity = 'CRITICAL';
        else if (type === 'FLOOD' || type === 'LANDSLIDE' || type === 'BLIZZARD' || type === 'HEATWAVE') {
          severity = 'HIGH';
        }
      }

      const regionLabel = event.title.includes(',')
        ? event.title.split(',').slice(1).join(',').trim()
        : `Oceanic / terrestrial · ${formatLat(lat)}, ${formatLng(lng)}`;

      events.push({
        id: `nasa-${event.id}`,
        type,
        title: event.title,
        locationName: event.title.split(',').pop()?.trim() || event.title,
        region: regionLabel,
        coordinates: [lat, lng],
        severity,
        status: 'ACTIVE',
        timestamp: new Date(geomDate).toISOString(),
        timeAgo: formatTimeAgo(geomDate),
        metrics,
        primarySource: `NASA EONET / ${primarySourceId}`,
        externalUrl,
        summary: `Open ${type.toLowerCase()} event monitored via NASA Earth Observatory telemetry${
          type === 'WILDFIRE' ? ` and ${primarySourceId}` : ''
        }.`,
        officialAdvisory:
          type === 'WILDFIRE'
            ? 'Observe regional forestry evacuation zones. Air quality advisory active for PM2.5 particulates.'
            : 'Monitor the originating agency bulletin for local instructions.',
        isLiveFeed: true,
        sourceFeed: 'nasa_eonet',
        isIndiaFocus: india,
      });
    }

    return events;
  } catch (err) {
    console.warn('Failed to fetch NASA EONET events:', err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// GDACS — UN/EC global alert feed (tropical cyclones, floods, droughts)
// ---------------------------------------------------------------------------
// GDACS is genuinely global and carries an explicit alert level plus the
// affected countries, which is what makes worldwide (and India) coverage real
// rather than US-centric. Earthquake events are intentionally NOT requested
// here because USGS already covers global seismicity with finer resolution.
const GDACS_EVENT_TYPES = 'TC,FL,DR';
const GDACS_TYPE_MAP: Record<string, DisasterType> = {
  EQ: 'EARTHQUAKE',
  TC: 'CYCLONE',
  FL: 'FLOOD',
  DR: 'DROUGHT',
  WF: 'WILDFIRE',
  VO: 'VOLCANO',
  TS: 'TSUNAMI',
};

interface GdacsProperties {
  eventtype: string;
  eventid: number;
  episodeid?: number;
  name?: string;
  country?: string;
  iso3?: string;
  alertlevel?: string;
  alertscore?: number;
  htmldescription?: string;
  source?: string;
  fromdate?: string;
  todate?: string;
  datemodified?: string;
  url?: { report?: string };
  severitydata?: { severity?: number; severitytext?: string; severityunit?: string };
  affectedcountries?: { iso2?: string; iso3?: string; countryname?: string }[];
}

/** Deterministic severity: the stronger of GDACS' alert level and the metric. */
function gdacsSeverity(
  alertlevel: string | undefined,
  type: DisasterType,
  metric?: number,
  unit?: string
): DisasterSeverity {
  let fromAlert: DisasterSeverity = 'LOW';
  switch ((alertlevel || '').toLowerCase()) {
    case 'red':
      fromAlert = 'CRITICAL';
      break;
    case 'orange':
      fromAlert = 'HIGH';
      break;
    case 'green':
      fromAlert = 'MEDIUM';
      break;
    default:
      fromAlert = 'LOW';
  }

  let fromMetric: DisasterSeverity = 'LOW';
  if (typeof metric === 'number') {
    if (type === 'EARTHQUAKE' && unit === 'M') {
      fromMetric = metric >= 6 ? 'CRITICAL' : metric >= 5 ? 'HIGH' : metric >= 4 ? 'MEDIUM' : 'LOW';
    } else if (type === 'CYCLONE' && /km/.test(unit || '')) {
      fromMetric = metric >= 150 ? 'CRITICAL' : metric >= 100 ? 'HIGH' : metric >= 63 ? 'MEDIUM' : 'LOW';
    }
  }

  return maxSeverity(fromAlert, fromMetric);
}

function gdacsAdvisory(alertlevel: string | undefined): string {
  switch ((alertlevel || '').toLowerCase()) {
    case 'red':
      return 'GDACS RED alert: high humanitarian impact expected. Follow national disaster management authority instructions.';
    case 'orange':
      return 'GDACS ORANGE alert: moderate humanitarian impact anticipated. Review local civil protection bulletins.';
    case 'green':
      return 'GDACS GREEN alert: minimal humanitarian impact expected. Continue routine monitoring.';
    default:
      return 'Monitor the originating agency bulletin for local instructions.';
  }
}

async function fetchGdacsEvents(): Promise<DisasterEvent[]> {
  try {
    const toDate = new Date();
    // 30-day window so ongoing multi-week floods, tropical cyclones, and droughts are retrieved
    const fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const day = (d: Date) => d.toISOString().slice(0, 10);

    const url =
      'https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH' +
      `?eventlist=${GDACS_EVENT_TYPES}` +
      `&fromdate=${day(fromDate)}&todate=${day(toDate)}` +
      '&alertlevel=Green,Orange,Red';

    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return [];

    const data = await res.json();
    const features: any[] = data.features || [];

    const out: DisasterEvent[] = [];
    const seen = new Set<string>();

    for (const feature of features) {
      const p: GdacsProperties = feature?.properties || ({} as GdacsProperties);
      const coords = feature?.geometry?.coordinates;
      if (!Array.isArray(coords) || coords.length < 2) continue;

      const [lng, lat] = coords;
      if (typeof lat !== 'number' || typeof lng !== 'number') continue;

      const type = GDACS_TYPE_MAP[p.eventtype];
      if (!type) continue;

      // SEARCH returns one row per episode; collapse to one marker per event.
      const id = `gdacs-${p.eventtype}-${p.eventid}`;
      if (seen.has(id)) continue;
      seen.add(id);

      const metric = p.severitydata?.severity;
      const unit = p.severitydata?.severityunit;
      const severity = gdacsSeverity(p.alertlevel, type, metric, unit);

      const countryNames = [
        ...(Array.isArray(p.affectedcountries)
          ? p.affectedcountries.map((c) => c.countryname).filter(Boolean)
          : []),
        p.country,
      ].filter((v): v is string => Boolean(v));

      const isoCodes = [
        ...(Array.isArray(p.affectedcountries)
          ? p.affectedcountries.map((c) => c.iso3).filter(Boolean)
          : []),
        p.iso3,
      ].filter((v): v is string => Boolean(v));

      const occurred = p.fromdate || p.datemodified || new Date().toISOString();
      const occurredMs = new Date(occurred).getTime();

      const metrics: Record<string, any> = {
        alertLevel: p.alertlevel,
        alertScore: p.alertscore,
        categoryScale: p.severitydata?.severitytext || `${type} event`,
      };
      if (type === 'EARTHQUAKE') metrics.magnitude = metric;
      if (type === 'CYCLONE') metrics.windSpeedKmh = metric;
      if (type === 'DROUGHT') metrics.impactAreaKm2 = metric;
      if (countryNames.length) metrics.countries = countryNames;

      out.push({
        id,
        type,
        title: (p.name || p.htmldescription || `${type} event`).slice(0, 140),
        locationName: p.country || countryNames[0] || 'Unknown region',
        region: countryNames.slice(0, 3).join(', ') || 'Global',
        coordinates: [lat, lng],
        severity,
        status: 'ACTIVE',
        timestamp: new Date(occurredMs).toISOString(),
        timeAgo: formatTimeAgo(occurredMs),
        metrics,
        primarySource: `GDACS${p.source ? ` / ${p.source}` : ''}`,
        externalUrl: p.url?.report,
        summary:
          p.severitydata?.severitytext ||
          p.htmldescription ||
          `GDACS-monitored ${type.toLowerCase()} event.`,
        officialAdvisory: gdacsAdvisory(p.alertlevel),
        isLiveFeed: true,
        sourceFeed: 'gdacs',
        countries: isoCodes,
        isIndiaFocus: indiaTagFrom(isoCodes) || isWithinIndia(lat, lng),
      });
    }

    return out;
  } catch (err) {
    console.warn('Failed to fetch GDACS events:', err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// NOAA / NWS tsunami warning centres (Atom feeds with real coordinates)
// ---------------------------------------------------------------------------
/** Payload returned by the /api/tsunami server proxy. */
interface TsunamiFeedPayload {
  id: string;
  centre: string;
  xml: string;
}

const TSUNAMI_SEVERITY: Record<string, DisasterSeverity> = {
  warning: 'CRITICAL',
  advisory: 'HIGH',
  watch: 'MEDIUM',
};

function readXmlElement(parent: Element, qualifiedName: string, ns?: string): string | null {
  const byNs = ns ? parent.getElementsByTagNameNS(ns, qualifiedName)[0] : undefined;
  const el = byNs ?? parent.getElementsByTagName(qualifiedName)[0];
  return el?.textContent?.trim() ?? null;
}

/**
 * Turns a tsunami Atom feed into TSUNAMI events.
 *
 * Only actual Warning / Advisory / Watch categories are emitted. "Information"
 * statements explicitly state there is no tsunami threat, so publishing them
 * as tsunami events would be misleading.
 */
function parseTsunamiFeed(xmlText: string, feed: { id: string; centre: string }): DisasterEvent[] {
  const xml = new DOMParser().parseFromString(xmlText, 'application/xml');
  if (xml.getElementsByTagName('parsererror').length > 0) return [];

  const events: DisasterEvent[] = [];
  const entries = Array.from(xml.getElementsByTagName('entry'));

  for (const entry of entries) {
    const summaryHtml = readXmlElement(entry, 'summary') || '';
    const category = (summaryHtml.match(/Category:\s*([A-Za-z]+)/)?.[1] || '').trim();
    const severity = TSUNAMI_SEVERITY[category.toLowerCase()];
    if (!severity) continue; // Information statement — no threat.

    const latRaw = readXmlElement(entry, 'lat', 'http://www.w3.org/2003/01/geo/wgs84_pos#');
    const lngRaw = readXmlElement(entry, 'long', 'http://www.w3.org/2003/01/geo/wgs84_pos#');
    const lat = latRaw ? Number.parseFloat(latRaw) : NaN;
    const lng = lngRaw ? Number.parseFloat(lngRaw) : NaN;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    const updated = readXmlElement(entry, 'updated') || new Date().toISOString();
    const updatedMs = new Date(updated).getTime();
    const region = readXmlElement(entry, 'title') || 'Ocean region';
    const bulletinUrl =
      entry.querySelector('link[rel="alternate"]')?.getAttribute('href') || undefined;
    const magnitude = summaryHtml.match(/Preliminary Magnitude:\s*<\/strong>\s*([\d.]+)/)?.[1];

    events.push({
      id: `tsunami-${feed.id}-${updated}`,
      type: 'TSUNAMI',
      title: `Tsunami ${category} — ${region}`,
      locationName: region,
      region: `Pacific / Oceanic basin · ${formatLat(lat)}, ${formatLng(lng)}`,
      coordinates: [lat, lng],
      severity,
      status: 'ACTIVE',
      timestamp: new Date(updatedMs).toISOString(),
      timeAgo: formatTimeAgo(updatedMs),
      metrics: {
        category: `${category} issued`,
        categoryScale: `${category} bulletin`,
        magnitude: magnitude ? Number.parseFloat(magnitude) : undefined,
      },
      primarySource: feed.centre,
      externalUrl: bulletinUrl,
      summary: `${category} bulletin issued by ${feed.centre} for ${region}.`,
      officialAdvisory: 'Follow national tsunami warning centre evacuation instructions immediately.',
      isLiveFeed: true,
      sourceFeed: 'noaa_ntwc',
      isIndiaFocus: isWithinIndia(lat, lng),
    });
  }

  return events;
}

async function fetchTsunamiAdvisories(): Promise<DisasterEvent[]> {
  if (typeof DOMParser === 'undefined') return []; // browser-only XML parsing

  try {
    // The upstream NOAA feeds have no CORS headers, so they are proxied by
    // /api/tsunami and parsed here with DOMParser.
    const res = await fetch('/api/tsunami');
    if (!res.ok) return [];

    const data = await res.json();
    const feeds: TsunamiFeedPayload[] = data.feeds || [];
    return feeds.flatMap((feed) => parseTsunamiFeed(feed.xml, feed));
  } catch (err) {
    console.warn('Failed to fetch tsunami advisories:', err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// ReliefWeb (UN OCHA) — human-curated global disasters
// ---------------------------------------------------------------------------
/**
 * ReliefWeb's API now requires a pre-approved `appname`; unregistered values
 * are rejected with HTTP 403 and its RSS feeds block automated clients. Set
 * NEXT_PUBLIC_RELIEFWEB_APPNAME after requesting one at
 * https://apidoc.reliefweb.int/parameters#appname to enable this source.
 *
 * Records without usable coordinates are skipped rather than geocoded, so no
 * event is ever placed with invented coordinates.
 */
async function fetchReliefWebEvents(): Promise<DisasterEvent[]> {
  const appname = process.env.NEXT_PUBLIC_RELIEFWEB_APPNAME;
  if (!appname) return [];

  const TYPE_MAP: Record<string, DisasterType> = {
    earthquake: 'EARTHQUAKE',
    flood: 'FLOOD',
    'tropical cyclone': 'CYCLONE',
    cyclone: 'CYCLONE',
    storm: 'CYCLONE',
    drought: 'DROUGHT',
    wildfire: 'WILDFIRE',
    'forest fire': 'WILDFIRE',
    volcano: 'VOLCANO',
    'volcanic eruption': 'VOLCANO',
    landslide: 'LANDSLIDE',
    'epidemic': 'EPIDEMIC',
    'cold wave': 'BLIZZARD',
    'heat wave': 'HEATWAVE',
    tsunami: 'TSUNAMI',
  };

  try {
    const url =
      'https://api.reliefweb.int/v2/disasters' +
      `?appname=${encodeURIComponent(appname)}` +
      '&profile=full&limit=60&sort[]=date:desc';

    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) {
      console.warn(`ReliefWeb request failed (${res.status}). Check the appname is approved.`);
      return [];
    }

    const data = await res.json();
    const records: any[] = data.data || [];
    const out: DisasterEvent[] = [];

    for (const record of records) {
      const fields = record.fields || {};
      const primaryCountry = fields.primary_country || {};
      const location = primaryCountry.location || {};
      const lat = typeof location.lat === 'number' ? location.lat : NaN;
      const lng = typeof location.lon === 'number' ? location.lon : NaN;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

      const rawTypes: string[] = (fields.type || []).map((t: any) =>
        String(t.name || '').toLowerCase()
      );
      const mapped = rawTypes.map((t) => TYPE_MAP[t]).find(Boolean);
      if (!mapped) continue;

      const created = fields.date?.created || new Date().toISOString();
      const createdMs = new Date(created).getTime();
      const isoCodes = [primaryCountry.iso3].filter(Boolean);

      out.push({
        id: `reliefweb-${record.id}`,
        type: mapped,
        title: (fields.name || 'Disaster').slice(0, 140),
        locationName: primaryCountry.name || 'Multiple countries',
        region: primaryCountry.name || 'Global',
        coordinates: [lat, lng],
        severity: fields.status === 'ongoing' ? 'HIGH' : 'MEDIUM',
        status: fields.status === 'ongoing' ? 'ACTIVE' : 'MONITORED',
        timestamp: new Date(createdMs).toISOString(),
        timeAgo: formatTimeAgo(createdMs),
        metrics: {
          status: fields.status,
          categoryScale: rawTypes.join(', ') || 'Disaster',
        },
        primarySource: 'ReliefWeb (UN OCHA)',
        externalUrl: fields.url,
        summary: `Human-curated disaster record from UN OCHA ReliefWeb. Status: ${fields.status || 'unknown'}.`,
        officialAdvisory: 'Humanitarian coordination updates are published on ReliefWeb.',
        isLiveFeed: true,
        sourceFeed: 'reliefweb',
        countries: isoCodes,
        isIndiaFocus: indiaTagFrom(isoCodes) || isWithinIndia(lat, lng),
      });
    }

    return out;
  } catch (err) {
    console.warn('Failed to fetch ReliefWeb disasters:', err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Aggregation
// ---------------------------------------------------------------------------
export async function fetchAllDisasters(): Promise<DisasterEvent[]> {
  const [earthquakes, nasaEvents, gdacsEvents, tsunamiEvents, reliefWebEvents] =
    await Promise.all([
      fetchUsgsEarthquakes(),
      fetchNasaEonetEvents(),
      fetchGdacsEvents(),
      fetchTsunamiAdvisories(),
      fetchReliefWebEvents(),
    ]);

  const combined = [
    ...earthquakes,
    ...nasaEvents,
    ...gdacsEvents,
    ...tsunamiEvents,
    ...reliefWebEvents,
  ];

  // Defensive de-duplication in case two feeds emit the same upstream id.
  const deduped = new Map<string, DisasterEvent>();
  for (const event of combined) {
    if (!deduped.has(event.id)) deduped.set(event.id, event);
  }

  // Freshness policy is the single gate for "what stays": per-hazard
  // retention windows, per-type caps (severity-first), global cap. Everything
  // downstream — map, list, KPIs, counts, notification fallback — renders
  // from this result, so no surface can show a "257d ago" drought again.
  return applyFreshnessPolicy([...deduped.values()]);
}

const CATEGORY_KEYS: { type: DisasterType; key: keyof CategoryCounts }[] = [
  { type: 'EARTHQUAKE', key: 'earthquake' },
  { type: 'WILDFIRE', key: 'wildfire' },
  { type: 'CYCLONE', key: 'cyclone' },
  { type: 'FLOOD', key: 'flood' },
  { type: 'TSUNAMI', key: 'tsunami' },
  { type: 'VOLCANO', key: 'volcano' },
  { type: 'TORNADO', key: 'tornado' },
  { type: 'LANDSLIDE', key: 'landslide' },
  { type: 'HEATWAVE', key: 'heatwave' },
  { type: 'BLIZZARD', key: 'blizzard' },
  { type: 'AVALANCHE', key: 'avalanche' },
  { type: 'SOLAR_STORM', key: 'solarStorm' },
  { type: 'EPIDEMIC', key: 'epidemic' },
  { type: 'DROUGHT', key: 'drought' },
];

export interface CategoryCounts {
  all: number;
  earthquake: number;
  wildfire: number;
  cyclone: number;
  flood: number;
  tsunami: number;
  volcano: number;
  tornado: number;
  landslide: number;
  heatwave: number;
  blizzard: number;
  avalanche: number;
  solarStorm: number;
  epidemic: number;
  drought: number;
}

/** Per-category counts for the sidebar filters. */
export function computeCategoryCounts(events: DisasterEvent[]): CategoryCounts {
  const counts = { all: events.length } as CategoryCounts;
  for (const { key } of CATEGORY_KEYS) counts[key] = 0;
  for (const event of events) {
    const entry = CATEGORY_KEYS.find((c) => c.type === event.type);
    if (entry) counts[entry.key] += 1;
  }
  return counts;
}

/** Determine whether an event falls within a given operational theater. */
export function isEventInRegion(event: DisasterEvent, region: RegionFocus): boolean {
  if (region === 'GLOBAL') return true;

  if (region === 'SOUTH_ASIA' || region === 'INDIA') {
    return isIndiaRelevant(event);
  }

  const [rawLat, rawLng] = event.coordinates || [0, 0];
  const lat = normalizeLatitude(rawLat);
  const lng = normalizeLongitude(rawLng);

  if (region === 'AMERICAS') {
    // North, Central, and South America (-175° to -30° lng, -60° to 80° lat)
    return lng >= -175 && lng <= -30 && lat >= -60 && lat <= 80;
  }

  if (region === 'EUROPE') {
    // Europe: -25° to 45° lng, 35° to 75° lat
    return lng >= -25 && lng <= 45 && lat >= 35 && lat <= 75;
  }

  if (region === 'AFRICA_ME') {
    // Africa and Middle East: -20° to 60° lng, -35° to 38° lat
    return lng >= -20 && lng <= 60 && lat >= -35 && lat < 36;
  }

  if (region === 'ASIA_PACIFIC') {
    // East Asia, SE Asia, Australia, Oceania, Pacific Rim
    const isAPACLng = (lng >= 60 && lng <= 180) || (lng >= -180 && lng <= -140);
    const isAPACLat = lat >= -50 && lat <= 75;
    return isAPACLng && isAPACLat;
  }

  return true;
}

export type RegionCountsRecord = Record<RegionFocus, number> & {
  global: number;
  india: number;
};

/** Compute live event counts for every regional theater. */
export function computeRegionCounts(events: DisasterEvent[]): RegionCountsRecord {
  const counts: Record<string, number> = {
    GLOBAL: events.length,
    AMERICAS: 0,
    ASIA_PACIFIC: 0,
    EUROPE: 0,
    SOUTH_ASIA: 0,
    AFRICA_ME: 0,
    INDIA: 0,
    global: events.length,
    india: 0,
  };

  for (const event of events) {
    if (isEventInRegion(event, 'AMERICAS')) counts.AMERICAS += 1;
    if (isEventInRegion(event, 'ASIA_PACIFIC')) counts.ASIA_PACIFIC += 1;
    if (isEventInRegion(event, 'EUROPE')) counts.EUROPE += 1;
    if (isEventInRegion(event, 'SOUTH_ASIA')) {
      counts.SOUTH_ASIA += 1;
      counts.INDIA += 1;
      counts.india += 1;
    }
    if (isEventInRegion(event, 'AFRICA_ME')) counts.AFRICA_ME += 1;
  }

  return counts as RegionCountsRecord;
}

/** Filter to region-relevant events only. */
export function filterByRegion(events: DisasterEvent[], region: RegionFocus): DisasterEvent[] {
  if (region === 'GLOBAL') return events;
  return events.filter((e) => isEventInRegion(e, region));
}

// Which wildfire severities count as a headline "active fire" KPI.
// NASA EONET's wildfire category is global and includes tiny monitored polygons,
// so counting every WILDFIRE event produces a US-dominated number that is not a
// meaningful headline. Count only fires that are actually significant.
export const SIGNIFICANT_FIRE_SEVERITIES = new Set(['HIGH', 'CRITICAL']);

export function computeGlobalStats(events: DisasterEvent[]): GlobalSensorStats {
  const activeFires = events.filter(
    (e) =>
      e.type === 'WILDFIRE' &&
      (SIGNIFICANT_FIRE_SEVERITIES.has(e.severity) ||
        (typeof e.metrics?.acresBurned === 'number' && e.metrics.acresBurned >= 1000))
  ).length;
  const significantQuakes = events.filter(
    (e) => e.type === 'EARTHQUAKE' && (Number(e.metrics?.magnitude) || 0) >= 4.5
  ).length;
  const tropicalStorms = events.filter((e) => e.type === 'CYCLONE').length;
  const majorFloods = events.filter((e) => e.type === 'FLOOD').length;
  const tsunamiWatches = events.filter((e) => e.type === 'TSUNAMI').length;

  return {
    activeFires,
    significantQuakes,
    tropicalStorms,
    majorFloods,
    tsunamiWatches,
    systemHealth: 'OPERATIONAL',
    sensorLatencyMs: 78,
    lastSyncUtc: new Date().toISOString(),
  };
}

/**
 * Pushes the normalised events into Supabase so the database trigger can
 * generate notifications. Silently no-ops when Supabase is not configured or
 * the schema has not been applied yet.
 */
export async function ingestEventsToSupabase(
  client: {
    rpc: (
      fn: string,
      args: Record<string, unknown>
    ) => PromiseLike<{ error: unknown }>;
  },
  events: DisasterEvent[]
): Promise<number> {
  if (events.length === 0) return 0;
  try {
    const { error } = await client.rpc('ingest_disaster_events', { p_events: events });
    if (error) {
      console.warn('[ingest] disaster event ingestion skipped:', error);
      return 0;
    }
    return events.length;
  } catch (err) {
    console.warn('[ingest] disaster event ingestion failed:', err);
    return 0;
  }
}

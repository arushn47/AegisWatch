export type DisasterType =
  | 'EARTHQUAKE'
  | 'WILDFIRE'
  | 'CYCLONE'
  | 'FLOOD'
  | 'TSUNAMI'
  | 'VOLCANO'
  | 'TORNADO'
  | 'LANDSLIDE'
  | 'HEATWAVE'
  | 'BLIZZARD'
  | 'AVALANCHE'
  | 'SOLAR_STORM'
  | 'EPIDEMIC'
  | 'DROUGHT';

export type DisasterSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

/** Lifecycle state of a monitored event. */
export type DisasterStatus = 'ACTIVE' | 'MONITORED' | 'CONTAINED' | 'RESOLVED';

/** Free-form metric bag; keys differ per hazard type (magnitude, windSpeedKmh, ...). */
export type DisasterMetrics = Record<string, any>;

export interface DisasterEvent {
  id: string;
  type: DisasterType;
  title: string;
  locationName: string;
  region: string;
  coordinates: [number, number]; // [lat, lng]
  severity: DisasterSeverity;
  /** Lifecycle state; live feeds default to ACTIVE. */
  status: DisasterStatus;
  timestamp: string;
  /** Pre-formatted relative time, e.g. "2h 15m ago". */
  timeAgo: string;
  summary: string;
  metrics: DisasterMetrics;
  sources?: { id: string; name: string }[];
  /** Human-readable originating agency / feed, e.g. "USGS Real-Time Feed". */
  primarySource?: string;
  /** Canonical link to the source record, if one exists. */
  externalUrl?: string;
  /** Official advisory / safety guidance text (may be a general reminder). */
  officialAdvisory?: string;
  /** True when the record came straight from a live upstream feed. */
  isLiveFeed?: boolean;
  /** Machine id of the originating feed, e.g. 'usgs', 'gdacs', 'nasa_eonet'. */
  sourceFeed?: string;
  /** ISO-3166 alpha-2/3 codes of affected countries, when the feed provides them. */
  countries?: string[];
  /** Pre-computed India / South Asia relevance flag. */
  isIndiaFocus?: boolean;
  /** GeoJSON Point mirror of `coordinates` (lng, lat order) for PostGIS payloads. */
  location?: {
    type: 'Point';
    coordinates: [number, number]; // GeoJSON uses [lng, lat]
  };
}

/** Aggregated status snapshot for the KPI banner. */
export interface GlobalSensorStats {
  activeFires: number;
  significantQuakes: number;
  tropicalStorms: number;
  majorFloods: number;
  tsunamiWatches: number;
  systemHealth: 'OPERATIONAL' | 'DEGRADED' | 'OFFLINE';
  sensorLatencyMs: number;
  lastSyncUtc: string;
}

/**
 * Geographic focus buckets surfaced in the sidebar region filter.
 */
export type RegionFocus =
  | 'GLOBAL'
  | 'AMERICAS'
  | 'ASIA_PACIFIC'
  | 'EUROPE'
  | 'SOUTH_ASIA'
  | 'AFRICA_ME'
  | 'INDIA';

export interface RegionTheater {
  id: RegionFocus;
  label: string;
  center: [number, number];
  zoom: number;
}

export const REGION_THEATERS: RegionTheater[] = [
  { id: 'GLOBAL', label: 'Global', center: [20, 0], zoom: 2.2 },
  { id: 'AMERICAS', label: 'Americas', center: [18, -85], zoom: 3 },
  { id: 'ASIA_PACIFIC', label: 'Asia-Pacific', center: [15, 120], zoom: 3 },
  { id: 'EUROPE', label: 'Europe', center: [50, 15], zoom: 3.8 },
  { id: 'SOUTH_ASIA', label: 'South Asia · India', center: [22, 79], zoom: 4.5 },
  { id: 'AFRICA_ME', label: 'Africa & M. East', center: [10, 25], zoom: 3.2 },
];

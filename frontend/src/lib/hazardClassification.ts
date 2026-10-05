import type { DisasterEvent, DisasterSeverity, DisasterType } from '../types/disaster';

export interface HazardCategoryMeta {
  type: DisasterType;
  label: string;
  color: string;
  badgeBg: string;
  description: string;
  activeWindow: string;
}

export const HAZARD_CATEGORIES: Record<DisasterType, HazardCategoryMeta> = {
  EARTHQUAKE: {
    type: 'EARTHQUAKE',
    label: 'Earthquake',
    color: '#d96528', // USGS seismic amber-orange
    badgeBg: 'rgba(217, 101, 40, 0.18)',
    description: 'Seismic activity & fault rupture telemetry',
    activeWindow: '2 – 7 Days',
  },
  WILDFIRE: {
    type: 'WILDFIRE',
    label: 'Wildfire',
    color: '#e04f26', // NASA FIRMS combustion orange-red
    badgeBg: 'rgba(224, 79, 38, 0.18)',
    description: 'Thermal anomalies & active fire perimeters',
    activeWindow: '7 – 21 Days',
  },
  CYCLONE: {
    type: 'CYCLONE',
    label: 'Cyclone / Storm',
    color: '#7c3aed', // WMO atmospheric cyclone violet
    badgeBg: 'rgba(124, 58, 237, 0.18)',
    description: 'Tropical cyclones, hurricanes & typhoons',
    activeWindow: '7 – 14 Days',
  },
  FLOOD: {
    type: 'FLOOD',
    label: 'Flood',
    color: '#0284c7', // Copernicus hydrological ocean blue
    badgeBg: 'rgba(2, 132, 199, 0.18)',
    description: 'Riverine overflow & inundation telemetry',
    activeWindow: '14 – 21 Days',
  },
  TSUNAMI: {
    type: 'TSUNAMI',
    label: 'Tsunami',
    color: '#0891b2', // NOAA marine warning teal
    badgeBg: 'rgba(8, 145, 178, 0.18)',
    description: 'Oceanic tsunami wave advisories & watches',
    activeWindow: '24 – 48 Hours',
  },
  VOLCANO: {
    type: 'VOLCANO',
    label: 'Volcano',
    color: '#dc2626', // Smithsonian volcanic crimson
    badgeBg: 'rgba(220, 38, 38, 0.18)',
    description: 'Volcanic eruptions, ash plumes & thermal signatures',
    activeWindow: 'Up to 30 Days',
  },
  LANDSLIDE: {
    type: 'LANDSLIDE',
    label: 'Landslide',
    color: '#b45309', // USGS earth amber
    badgeBg: 'rgba(180, 83, 9, 0.18)',
    description: 'Mass movement & debris flow telemetry',
    activeWindow: '3 – 10 Days',
  },
  DROUGHT: {
    type: 'DROUGHT',
    label: 'Drought',
    color: '#ca8a04', // Arid gold
    badgeBg: 'rgba(202, 138, 4, 0.18)',
    description: 'Severe precipitation deficit & vegetation stress',
    activeWindow: 'Up to 45 Days',
  },
  HEATWAVE: {
    type: 'HEATWAVE',
    label: 'Heatwave',
    color: '#ea580c', // Thermal solar orange
    badgeBg: 'rgba(234, 88, 12, 0.18)',
    description: 'Extreme temperature anomalies',
    activeWindow: '5 – 10 Days',
  },
  BLIZZARD: {
    type: 'BLIZZARD',
    label: 'Blizzard',
    color: '#3b82f6', // Arctic cryo blue
    badgeBg: 'rgba(59, 130, 246, 0.18)',
    description: 'Severe winter storms & snow cover',
    activeWindow: '3 – 7 Days',
  },
  TORNADO: {
    type: 'TORNADO',
    label: 'Tornado',
    color: '#6d28d9', // Severe convective deep violet
    badgeBg: 'rgba(109, 40, 217, 0.18)',
    description: 'Severe convective vortices',
    activeWindow: '24 – 48 Hours',
  },
  AVALANCHE: {
    type: 'AVALANCHE',
    label: 'Avalanche',
    color: '#0ea5e9', // Snowpack blue
    badgeBg: 'rgba(14, 165, 233, 0.18)',
    description: 'Snowpack instability',
    activeWindow: '48 – 72 Hours',
  },
  SOLAR_STORM: {
    type: 'SOLAR_STORM',
    label: 'Solar Storm',
    color: '#d946ef', // Geomagnetic magenta
    badgeBg: 'rgba(217, 70, 239, 0.18)',
    description: 'Geomagnetic disturbance',
    activeWindow: '1 – 3 Days',
  },
  EPIDEMIC: {
    type: 'EPIDEMIC',
    label: 'Epidemic',
    color: '#16a34a', // Biological surveillance green
    badgeBg: 'rgba(22, 163, 74, 0.18)',
    description: 'Biological outbreak monitoring',
    activeWindow: 'Up to 60 Days',
  },
};

export interface SeverityMeta {
  level: DisasterSeverity;
  label: string;
  coreSize: number;
  pulse: boolean;
  color: string;
  badgeClass: string;
  description: string;
}

export const SEVERITY_LEVELS: Record<DisasterSeverity, SeverityMeta> = {
  CRITICAL: {
    level: 'CRITICAL',
    label: 'High Risk',
    coreSize: 11,
    pulse: true,
    color: '#dc2626',
    badgeClass: 'bg-red-500/20 text-red-400 border-red-500/40',
    description: 'Imminent threat to life or severe catastrophe',
  },
  HIGH: {
    level: 'HIGH',
    label: 'Warning',
    coreSize: 9,
    pulse: true,
    color: '#ea580c',
    badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    description: 'Significant disaster event requiring heightened vigilance',
  },
  MEDIUM: {
    level: 'MEDIUM',
    label: 'Monitoring',
    coreSize: 7,
    pulse: false,
    color: '#0284c7',
    badgeClass: 'bg-sky-500/20 text-sky-400 border-sky-500/40',
    description: 'Active event under continuous telemetry observation',
  },
  LOW: {
    level: 'LOW',
    label: 'Safe / Low',
    coreSize: 6,
    pulse: false,
    color: '#64748b',
    badgeClass: 'bg-slate-500/20 text-slate-400 border-slate-500/40',
    description: 'Minor or contained incident with low localized impact',
  },
};

/**
 * Returns marker rendering metadata (color, dot size, pulse) for any event.
 */
export function getEventMarkerStyle(incident: DisasterEvent): {
  color: string;
  badgeLabel: string;
  coreSize: number;
  pulse: boolean;
} {
  const sevMeta = SEVERITY_LEVELS[incident.severity] || SEVERITY_LEVELS.LOW;
  const cat = HAZARD_CATEGORIES[incident.type];
  const color = cat?.color || '#64748b';
  let badgeLabel = cat?.label || 'Event';

  if (incident.type === 'WILDFIRE') {
    const acres = incident.metrics?.acresBurned;
    badgeLabel = acres ? `${(acres / 1000).toFixed(1)}k ac` : 'Wildfire';
  } else if (incident.type === 'EARTHQUAKE') {
    badgeLabel = incident.metrics?.magnitude ? `M ${incident.metrics.magnitude.toFixed(1)}` : 'Quake';
  } else if (incident.type === 'CYCLONE') {
    badgeLabel = incident.metrics?.windSpeedKmh ? `${incident.metrics.windSpeedKmh} km/h` : 'Cyclone';
  } else if (incident.type === 'FLOOD') {
    badgeLabel = incident.metrics?.crestHeightM ? `+${incident.metrics.crestHeightM}m` : 'Flood';
  } else if (incident.type === 'VOLCANO') {
    badgeLabel = 'Eruption';
  } else if (incident.type === 'TSUNAMI') {
    badgeLabel = 'Watch';
  }

  return {
    color,
    badgeLabel,
    coreSize: sevMeta.coreSize,
    pulse: sevMeta.pulse,
  };
}

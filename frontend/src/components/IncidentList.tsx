'use client';

import React from 'react';
import { Radio } from 'lucide-react';
import type { DisasterEvent } from '../types/disaster';
import { useStaggerIn } from '../lib/motion';

interface IncidentListProps {
  incidents: DisasterEvent[];
  selectedIncident: DisasterEvent | null;
  onSelectIncident: (incident: DisasterEvent) => void;
}

/** 3px left accent stripe, keyed to severity. */
const SEVERITY_STRIPE: Record<string, string> = {
  CRITICAL: 'bg-error',
  HIGH: 'bg-tertiary',
  MEDIUM: 'bg-primary',
  LOW: 'bg-outline',
};

/** Severity label color, keyed to severity. */
const SEVERITY_TEXT: Record<string, string> = {
  CRITICAL: 'text-error',
  HIGH: 'text-tertiary',
  MEDIUM: 'text-primary',
  LOW: 'text-outline',
};

function formatCoords(coordinates?: [number, number]): string {
  if (!coordinates || coordinates.length !== 2) return '';
  const [lat, lng] = coordinates;
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(2)}\u00b0${latDir}, ${Math.abs(lng).toFixed(2)}\u00b0${lngDir}`;
}

export const IncidentList: React.FC<IncidentListProps> = ({
  incidents,
  selectedIncident,
  onSelectIncident,
}) => {
  // Active operational incidents sorted newest first.
  // Rapid impulse hazards (minor quakes, convective storms) are framed to 48 hours,
  // while ongoing multi-day and chronic disasters (floods, cyclones, wildfires, volcanoes)
  // remain active in this feed for up to 7 days.
  const recentIncidents = [...incidents]
    .filter((incident) => {
      const ageMs = Date.now() - new Date(incident.timestamp).getTime();
      const isMultiDayOrChronic = [
        'FLOOD',
        'CYCLONE',
        'WILDFIRE',
        'VOLCANO',
        'DROUGHT',
        'LANDSLIDE',
        'HEATWAVE',
      ].includes(incident.type);
      const windowMs = isMultiDayOrChronic
        ? 7 * 24 * 60 * 60 * 1000
        : 48 * 60 * 60 * 1000;
      return ageMs <= windowMs;
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Stagger the cards in the first time live data lands.
  const gridRef = useStaggerIn<HTMLDivElement>(recentIncidents.length > 0, { y: 16, stagger: 0.03 });

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* List Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div>
            <h2 className="font-headline-sm text-lg text-on-surface font-bold tracking-tight">
              Recent Global Alerts
            </h2>
            <p className="font-body-sm text-xs text-outline mt-0.5">
              Active operational alerts &bull; Hazard-specific timelines
            </p>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-surface-container-high border border-outline-variant/40 font-label-mono-sm text-[10px] text-primary flex items-center gap-1 font-semibold">
            <Radio className="w-2.5 h-2.5 text-primary animate-pulse" />
            LIVE
          </span>
        </div>
        <span className="font-label-mono-sm text-xs text-outline tabular-nums">
          {recentIncidents.length} EVENTS
        </span>
      </div>

      {/* Incident Card Stack */}
      <div
        ref={gridRef}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:max-h-[500px] md:overflow-y-auto pr-2 pb-4 custom-scrollbar"
      >
        {recentIncidents.length === 0 ? (
          <div className="p-8 rounded-xl bg-surface-container-low border border-outline-variant/30 text-center flex flex-col items-center justify-center gap-2 text-outline md:col-span-2 lg:col-span-3 xl:col-span-4">
            <span className="font-headline-sm text-sm text-on-surface-variant font-semibold">
              No Active Alerts in Recent Operational Window
            </span>
            <span className="font-body-sm text-xs">
              No recent hazard alerts match this filter. The tactical map above displays all active events across their full operational lifecycles.
            </span>
          </div>
        ) : (
          recentIncidents.map(incident => {
            const isSelected = selectedIncident?.id === incident.id;
            const stripe = SEVERITY_STRIPE[incident.severity] ?? SEVERITY_STRIPE.LOW;
            const severityText = SEVERITY_TEXT[incident.severity] ?? SEVERITY_TEXT.LOW;

            // Domain tag + headline metric styling
            let badgeBg = 'bg-primary/15 text-primary border-primary/30';
            let metricColor = 'text-primary';
            let metricText = '';

            if (incident.type === 'EARTHQUAKE') {
              badgeBg = 'bg-[#c2692a]/15 text-[#c2692a] border-[#c2692a]/30';
              metricColor = 'text-[#c2692a]';
              metricText = incident.metrics.magnitude ? `M ${incident.metrics.magnitude.toFixed(1)}` : 'Quake';
            } else if (incident.type === 'WILDFIRE') {
              const acres = incident.metrics.acresBurned;
              const critical =
                incident.severity === 'CRITICAL' ||
                (typeof acres === 'number' && acres >= 10000);
              const high =
                incident.severity === 'HIGH' ||
                (typeof acres === 'number' && acres >= 2000);
              if (critical) {
                badgeBg = 'bg-[#dc2626]/15 text-[#dc2626] border-[#dc2626]/30';
                metricColor = 'text-[#dc2626]';
              } else if (high) {
                badgeBg = 'bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/30';
                metricColor = 'text-[#f59e0b]';
              } else {
                badgeBg = 'bg-outline/15 text-outline border-outline/30';
                metricColor = 'text-outline';
              }
              metricText = incident.metrics.categoryScale || 'Fire';
            } else if (incident.type === 'CYCLONE') {
              badgeBg = 'bg-primary-container/20 text-primary border-primary-container/40';
              metricColor = 'text-primary';
              metricText = incident.metrics.windSpeedKmh ? `${incident.metrics.windSpeedKmh} km/h` : 'Cyclone';
            } else if (incident.type === 'FLOOD') {
              badgeBg = 'bg-surface-tint/15 text-surface-tint border-surface-tint/30';
              metricColor = 'text-surface-tint';
              metricText = incident.metrics.crestHeightM ? `+${incident.metrics.crestHeightM}m` : 'Flood';
            } else if (incident.type === 'TSUNAMI') {
              badgeBg = 'bg-tertiary-fixed/20 text-tertiary border-tertiary/30';
              metricColor = 'text-tertiary';
              metricText = 'Tsunami Watch';
            } else if (incident.type === 'VOLCANO') {
              badgeBg = 'bg-error/20 text-error border-error/40';
              metricColor = 'text-error';
              metricText = 'Eruption';
            } else {
              badgeBg = 'bg-outline/15 text-outline border-outline/30';
              metricColor = 'text-outline';
              metricText = 'Alert';
            }

            const coords = formatCoords(incident.coordinates);
            const subtitle = [incident.region, coords].filter(Boolean).join(' \u00b7 ');

            return (
              <div
                key={incident.id}
                onClick={() => onSelectIncident(incident)}
                className={`alert-card group relative flex flex-col gap-2.5 p-3.5 pl-4 rounded-lg border transition-all duration-200 cursor-pointer overflow-hidden ${
                  isSelected
                    ? 'bg-surface-container-high border-primary/50 shadow-md shadow-primary/10 ring-1 ring-primary/40'
                    : 'bg-surface-container-low hover:bg-surface-container border-outline-variant/30 hover:border-primary/40 hover:-translate-y-0.5'
                }`}
              >
                {/* Severity accent stripe */}
                <span className={`absolute left-0 top-0 bottom-0 w-[3px] ${stripe}`} aria-hidden="true" />

                {/* Header: domain badge · elapsed time · headline metric */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`px-2 py-0.5 rounded border font-label-mono-sm text-[10px] font-bold uppercase tracking-wider shrink-0 ${badgeBg}`}>
                      {incident.type}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-outline-variant shrink-0"></span>
                    <span className="font-label-mono-sm text-[11px] text-outline truncate">
                      {incident.timeAgo}
                    </span>
                  </div>
                  <span className={`font-label-mono-md text-sm font-bold tabular-nums shrink-0 ${metricColor}`}>
                    {metricText}
                  </span>
                </div>

                {/* Title */}
                <span className="font-headline-md text-[16px] font-extrabold text-on-surface line-clamp-1 tracking-tight">
                  {incident.locationName || incident.title}
                </span>

                {/* Telemetry subtitle */}
                {subtitle && (
                  <span className="font-label-mono-sm text-[10px] text-outline line-clamp-1 tabular-nums">
                    {subtitle}
                  </span>
                )}

                {/* Footer: severity · origin · source feed · affordance */}
                <div className="flex items-center justify-between gap-2 pt-1.5 mt-0.5 border-t border-outline-variant/20">
                  <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                    <span className={`font-label-mono-sm text-[10px] font-bold uppercase tracking-wider ${severityText}`}>
                      {incident.severity}
                    </span>
                    {incident.isIndiaFocus && (
                      <span className="font-label-mono-sm text-[10px] px-1.5 py-0.5 rounded-sm bg-tertiary/15 text-tertiary border border-tertiary/30 font-bold">
                        IND
                      </span>
                    )}
                    {incident.sourceFeed && (
                      <span
                        className="font-label-mono-sm text-[9px] px-1.5 py-0.5 rounded bg-surface-container-highest/70 text-outline border border-outline-variant/30 uppercase font-medium"
                        title={`Verified telemetry source: ${incident.primarySource || incident.sourceFeed}`}
                      >
                        {incident.sourceFeed === 'nasa_eonet'
                          ? 'NASA'
                          : incident.sourceFeed === 'noaa_tsunami'
                          ? 'NOAA'
                          : incident.sourceFeed}
                      </span>
                    )}
                  </div>
                  <span className="font-label-mono-sm text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    DETAILS &rarr;
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

'use client';

import React from 'react';
import { Radio } from 'lucide-react';
import type { DisasterEvent } from '../types/disaster';

interface IncidentListProps {
  incidents: DisasterEvent[];
  selectedIncident: DisasterEvent | null;
  onSelectIncident: (incident: DisasterEvent) => void;
}

export const IncidentList: React.FC<IncidentListProps> = ({
  incidents,
  selectedIncident,
  onSelectIncident,
}) => {
  // Only show incidents from the last 48 hours, sorted newest first
  // Only show events from the last 48 hours, sorted newest first
  const recentIncidents = [...incidents]
    .filter(incident => {
      const ageMs = Date.now() - new Date(incident.timestamp).getTime();
      return ageMs <= 48 * 60 * 60 * 1000;
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* List Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div>
            <h2 className="font-headline-sm text-lg text-on-surface font-bold tracking-tight">
              Recent Global Alerts
            </h2>
            <p className="font-body-sm text-xs text-outline mt-0.5">Past 48 hours alerts</p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[500px] overflow-y-auto pr-2 pb-4 custom-scrollbar">
        {recentIncidents.length === 0 ? (
          <div className="p-8 rounded-xl bg-surface-container-low border border-outline-variant/30 text-center flex flex-col items-center justify-center gap-2 text-outline">
            <span className="font-headline-sm text-sm text-on-surface-variant font-semibold">
              No Events in the Last 48 Hours
            </span>
            <span className="font-body-sm text-xs">
              No new disasters have been detected in the past 48 hours. The map still shows all historical events.
            </span>
          </div>
        ) : (
          recentIncidents.map(incident => {
            const isSelected = selectedIncident?.id === incident.id;

            // Domain tag styles
            let badgeBg = 'bg-primary/15 text-primary border-primary/30';
            let metricColor = 'text-primary';
            let metricText = '';
            
            if (incident.type === 'EARTHQUAKE') {
              badgeBg = 'bg-[#c2692a]/15 text-[#c2692a] border-[#c2692a]/30';
              metricColor = 'text-[#c2692a]';
              metricText = incident.metrics.magnitude ? `M ${incident.metrics.magnitude.toFixed(1)}` : 'Quake';
                          } else if (incident.type === 'WILDFIRE') {
              badgeBg = 'bg-[#dc2626]/15 text-[#dc2626] border-[#dc2626]/30';
              metricColor = 'text-[#dc2626]';
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

            return (
              <div
                key={incident.id}
                onClick={() => onSelectIncident(incident)}
                className={`alert-card flex flex-col gap-2 p-3 rounded-xl border transition-all duration-200 cursor-pointer shadow-sm ${
                  isSelected
                    ? 'bg-surface-container-high border-primary/50 shadow-md shadow-primary/10 ring-1 ring-primary/40'
                    : 'bg-surface-container-low hover:bg-surface-container border-outline-variant/30 hover:border-outline-variant/60'
                }`}
              >
                {/* Card Top Row: Badge, Time, and Metric */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded border font-label-mono-sm text-[10px] font-bold uppercase tracking-wider ${badgeBg}`}>
                      {incident.type}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                    <span className="font-label-mono-sm text-[11px] text-outline">
                      {incident.timeAgo}
                    </span>
                  </div>
                  <span className={`font-label-mono-md text-sm font-bold tabular-nums ${metricColor}`}>
                    {metricText}
                  </span>
                </div>

                {/* Clean Title */}
                <span className="font-headline-md text-[17px] font-extrabold text-white line-clamp-1 mt-1 pb-1 tracking-tight drop-shadow-sm">
                  {incident.locationName || incident.title}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

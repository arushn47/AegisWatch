'use client';

import React, { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  MapPin, 
  AlertTriangle, 
  Info,
  Layers, 
  Compass, 
  ShieldCheck,
  Activity,
  Flame,
  Wind,
  Waves,
  Clock,
  Check,
  Copy,
  Radio,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { DisasterEvent } from '../types/disaster';

interface IncidentDetailModalProps {
  incident: DisasterEvent | null;
  onClose: () => void;
}

export const IncidentDetailModal: React.FC<IncidentDetailModalProps> = ({
  incident,
  onClose,
}) => {
  const [aiExpanded, setAiExpanded] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  if (!incident) return null;

  const [lat, lng] = incident.coordinates;
  const isHighSeverity = incident.severity === 'CRITICAL' || incident.severity === 'HIGH';

  // Format latitude and longitude cleanly without negative east coordinates
  const formatCoord = (coord: number, isLat: boolean): string => {
    const dir = isLat ? (coord >= 0 ? 'N' : 'S') : (coord >= 0 ? 'E' : 'W');
    return `${Math.abs(coord).toFixed(2)}° ${dir}`;
  };

  // Severity-dependent colors and styles
  const severityGradient =
    incident.severity === 'CRITICAL'
      ? 'bg-gradient-to-r from-red-600 via-rose-500 to-amber-500'
      : incident.severity === 'HIGH'
        ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-400'
        : incident.severity === 'MEDIUM'
          ? 'bg-gradient-to-r from-cyan-500 via-teal-400 to-sky-400'
          : 'bg-gradient-to-r from-slate-600 to-slate-400';

  const severityChip =
    incident.severity === 'CRITICAL'
      ? 'bg-error/15 text-error border-error/35'
      : incident.severity === 'HIGH'
        ? 'bg-tertiary/15 text-tertiary border-tertiary/35'
        : incident.severity === 'MEDIUM'
          ? 'bg-primary/15 text-primary border-primary/35'
          : 'bg-surface-container-highest text-on-surface-variant border-outline-variant/30';

  const severityDot =
    incident.severity === 'CRITICAL'
      ? 'bg-error animate-pulse'
      : incident.severity === 'HIGH'
        ? 'bg-tertiary animate-pulse'
        : incident.severity === 'MEDIUM'
          ? 'bg-primary'
          : 'bg-outline';

  const getHazardIcon = (type: string) => {
    switch (type) {
      case 'EARTHQUAKE':
        return <Activity className="w-3.5 h-3.5 text-tertiary" />;
      case 'WILDFIRE':
        return <Flame className="w-3.5 h-3.5 text-orange-400" />;
      case 'CYCLONE':
        return <Wind className="w-3.5 h-3.5 text-cyan-400" />;
      case 'FLOOD':
      case 'TSUNAMI':
        return <Waves className="w-3.5 h-3.5 text-sky-400" />;
      default:
        return <Radio className="w-3.5 h-3.5 text-primary" />;
    }
  };

  const getChecklistSteps = (): string[] => {
    if (incident.type === 'EARTHQUAKE') {
      return [
        'DROP, COVER, AND HOLD ON: Protect head and neck under a sturdy table or interior frame.',
        'Stay clear of glass facades, exterior perimeter walls, and heavy overhead lighting.',
        'Inspect gas, water, and electrical supply mains for fractures before re-entry.',
        'Prepare for secondary aftershocks: keep emergency Grab-Bag accessible and shoes bedside.',
      ];
    }
    if (incident.type === 'WILDFIRE') {
      return [
        'Review Local Defense Sectors: If in an active Evacuation Zone, depart immediately.',
        'Seal all exterior vents and windows. Switch HVAC systems to indoor recirculate mode.',
        'Position vehicle forward in driveway with emergency provisions loaded and key ready.',
        'Equip particulate respirators (N95/P100) outdoors to mitigate toxic smoke inhalation.',
      ];
    }
    if (incident.type === 'CYCLONE') {
      return [
        'Secure exterior loose structural components, awnings, and outdoor installations.',
        'Store a minimum 3 gallons of potable water per person in clean, sealed vessels.',
        'Disconnect non-essential sensitive electronics to prevent power-restoration surge damage.',
        'Never cross flooded roads or underpasses: 6 inches of moving water can dislodge vehicles.',
      ];
    }
    return [
      'Ascend to elevated ground if residing in low-lying drainage basins or river zones.',
      'Never drive or wade through flood currents: Turn Around, Don’t Drown.',
      'Boil or purify municipal tap water (rolling boil minimum 1 minute) before consumption.',
      'Maintain battery-powered receiver tuned to emergency civil broadcast relay frequencies.',
    ];
  };

  const handleCopyId = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(incident.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Compile structured metric cards
  const metrics: Array<{
    label: string;
    value: string;
    unit?: string;
    sub: string;
    color: string;
    statusDot?: boolean;
    isSource?: boolean;
  }> = [];

  if (incident.metrics.windSpeedKmh) {
    metrics.push({
      label: 'MAX SUSTAINED WIND',
      value: `${incident.metrics.windSpeedKmh}`,
      unit: 'km/h',
      sub: 'Peak Surface Gusts',
      color: 'text-primary',
    });
  }
  if (incident.metrics.magnitude) {
    metrics.push({
      label: 'SEISMIC MAGNITUDE',
      value: `M ${incident.metrics.magnitude.toFixed(1)}`,
      sub: 'Moment Scale (Mw)',
      color: 'text-tertiary',
    });
  }
  if (incident.metrics.depthKm !== undefined) {
    metrics.push({
      label: 'FOCAL DEPTH',
      value: `${incident.metrics.depthKm}`,
      unit: 'km',
      sub: 'Crustal Hypocenter',
      color: 'text-on-surface',
    });
  }
  if (incident.metrics.acresBurned) {
    metrics.push({
      label: 'PERIMETER BURNED',
      value: `${incident.metrics.acresBurned.toLocaleString()}`,
      unit: 'ac',
      sub: incident.metrics.containmentPercent !== undefined
        ? `Contained: ${incident.metrics.containmentPercent}%`
        : 'Active Fire Perimeter',
      color: 'text-secondary',
    });
  }
  if (incident.metrics.crestHeightM) {
    metrics.push({
      label: 'CREST SURGE',
      value: `+${incident.metrics.crestHeightM}`,
      unit: 'm',
      sub: 'Above Standard Datum',
      color: 'text-primary',
    });
  }

  // Always include Status card
  metrics.push({
    label: 'STATUS',
    value: incident.status || 'ACTIVE',
    sub: 'Live Monitored Event',
    color: isHighSeverity ? 'text-error' : 'text-primary',
    statusDot: true,
  });

  // Always include Coordinates card
  metrics.push({
    label: 'COORDINATES',
    value: `${formatCoord(lat, true)}, ${formatCoord(lng, false)}`,
    sub: 'Epicenter Lock',
    color: 'text-on-surface',
  });

  // Always include Source card
  metrics.push({
    label: 'PRIMARY SOURCE',
    value: incident.primarySource || 'Global Sensor Net',
    sub: 'Verified Feed',
    color: 'text-on-surface',
    isSource: true,
  });

  const checklist = getChecklistSteps();

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none" 
      onClick={onClose}
    >
      <div 
        className="relative w-full h-full sm:h-[88vh] sm:max-w-4xl sm:max-h-[780px] bg-surface-container-lowest sm:rounded-2xl border-0 sm:border border-outline-variant/30 shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Severity Glowing Accent Bar */}
        <div className={`h-1.5 w-full shrink-0 ${severityGradient}`} />

        {/* Mobile Drag Indicator Bar */}
        <div className="sm:hidden pt-2 pb-0.5 flex justify-center bg-surface-container-low/50">
          <div className="w-10 h-1 rounded-full bg-outline-variant/60" />
        </div>

        {/* Modal Header */}
        <div className="px-4 py-3.5 sm:px-6 sm:py-4 border-b border-outline-variant/20 bg-surface-container-low/70 flex items-start justify-between gap-3 shrink-0">
          <div className="flex flex-col gap-1.5 min-w-0 flex-1">
            {/* Chips row */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-label-mono-sm font-bold uppercase tracking-wider bg-surface-container-high border border-outline-variant/40 text-on-surface">
                {getHazardIcon(incident.type)}
                <span>{incident.type}</span>
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-label-mono-sm font-bold uppercase tracking-wider border ${severityChip}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${severityDot}`} />
                <span>{incident.severity} SEVERITY</span>
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-label-mono-sm text-outline">
                <Clock className="w-3 h-3 text-outline" />
                <span>{incident.timeAgo}</span>
              </span>
            </div>

            {/* Title */}
            <h2 className="font-headline-sm text-lg sm:text-2xl font-bold text-on-surface tracking-tight leading-snug">
              {incident.title}
            </h2>

            {/* Location & GPS Badge */}
            <div className="flex items-center gap-2 flex-wrap text-xs text-on-surface-variant">
              <div className="flex items-center gap-1.5 font-medium truncate max-w-[260px] sm:max-w-md">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="truncate">{incident.locationName || incident.region}</span>
              </div>
              <span className="text-outline font-mono text-[11px] px-2 py-0.5 rounded-md bg-surface-container border border-outline-variant/30">
                {formatCoord(lat, true)}, {formatCoord(lng, false)}
              </span>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors shrink-0 border border-outline-variant/30 cursor-pointer active:scale-95 touch-manipulation"
            type="button"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div 
          className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain p-4 sm:p-6 space-y-5 custom-scrollbar touch-pan-y"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* Telemetry Metrics Grid */}
          <div>
            <div className="px-1 pb-2">
              <span className="font-label-mono-sm text-[11px] text-outline uppercase tracking-widest font-semibold">
                Live Sensor Telemetry
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
              {metrics.map((m, idx) => (
                <div 
                  key={idx} 
                  className="p-3 sm:p-3.5 rounded-xl bg-surface-container/70 hover:bg-surface-container border border-outline-variant/30 hover:border-primary/40 transition-colors flex flex-col justify-between shadow-sm min-h-[82px]"
                >
                  <span className="font-label-mono-sm text-[10px] text-outline uppercase tracking-wider font-semibold truncate">
                    {m.label}
                  </span>
                  <div className="my-1 flex items-baseline gap-1 min-w-0">
                    {m.statusDot && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-1 shrink-0" />
                    )}
                    <span className={`font-mono text-base sm:text-lg font-bold truncate leading-tight ${m.color}`}>
                      {m.value}
                    </span>
                    {m.unit && (
                      <span className="font-label-mono-sm text-xs text-outline font-medium">
                        {m.unit}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-on-surface-variant/80">
                    <span className="truncate">{m.sub}</span>
                    {m.isSource && (
                      <span className="text-primary font-label-mono-sm font-semibold ml-1 shrink-0">
                        ✓ Verified
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Two-Column Responsive Section: Situation Report & Local Impact */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
            {/* Left Column: Situation Report & Advisory */}
            <div className="flex flex-col gap-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                      <Layers className="w-4 h-4" />
                    </div>
                    <span className="font-label-mono-sm text-xs text-on-surface uppercase tracking-wider font-bold">
                      Situation Report
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-semibold">
                    LIVE INTEL
                  </span>
                </div>
                <p className="text-on-surface text-sm leading-relaxed font-body-md">
                  {incident.summary}
                </p>

                {incident.officialAdvisory && (
                  <div className="mt-1 p-3 rounded-xl bg-primary/10 border border-primary/25 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-xs text-on-surface leading-relaxed font-medium">
                      {incident.officialAdvisory}
                    </p>
                  </div>
                )}
              </div>

              {/* Local Impact Assessment Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-2.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-surface-container-high text-primary">
                      <Compass className="w-4 h-4" />
                    </div>
                    <span className="font-label-mono-sm text-xs text-on-surface font-bold uppercase tracking-wider">
                      Sector Impact Telemetry
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full font-label-mono-sm text-[10px] font-bold ${
                    isHighSeverity
                      ? 'bg-secondary-container text-white'
                      : 'bg-primary-container text-on-primary-container'
                  }`}>
                    {isHighSeverity ? 'ELEVATED ATTENTION' : 'STANDARD MONITORING'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                  Severity-based advisory for this sector. Saved stations and enabled GPS telemetry allow distance-aware proximity ranking for hazards near you.
                </p>
              </div>
            </div>

            {/* Right Column: Safety Guidance Protocol & Official Notice */}
            <div className="flex flex-col gap-4">
              {/* Emergency Safety Protocol Checklist */}
              <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-low border border-primary/30 flex flex-col gap-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                      <ShieldCheck className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider">
                      Safety Protocol Checklist
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAiExpanded(!aiExpanded)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/30 text-on-surface-variant text-xs font-medium transition-colors cursor-pointer"
                  >
                    <span>{aiExpanded ? 'Collapse' : 'Expand'}</span>
                    {aiExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <p className="text-[11px] text-outline">
                  Standard immediate civil defense response procedures for {incident.type.toLowerCase()} events.
                </p>

                {aiExpanded && (
                  <ul className="flex flex-col gap-2.5 pt-2 border-t border-outline-variant/20">
                    {checklist.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-on-surface leading-relaxed">
                        <span className="w-5 h-5 rounded-full bg-primary/15 text-primary border border-primary/30 font-mono text-[11px] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                          {idx + 1}
                        </span>
                        <span className="flex-1">{step}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Informational Advisory Notice */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-surface-container-high/40 border border-outline-variant/30 flex items-start gap-3 mt-auto">
                <Info className="w-4 h-4 text-outline shrink-0 mt-0.5" />
                <p className="text-[11px] text-outline leading-relaxed">
                  AegisWatch provides situational decision support and aggregated sensor data. Always adhere to lawful guidance issued by local civil defense and emergency management authorities.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-t border-outline-variant/20 bg-surface-container shrink-0 flex items-center justify-between gap-3">
          {/* Reference ID Pill with Copy button */}
          <div className="flex items-center min-w-0">
            <button
              type="button"
              onClick={handleCopyId}
              title="Copy Incident Reference ID"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/30 text-on-surface-variant hover:text-on-surface text-xs font-label-mono-sm transition-all cursor-pointer active:scale-95 shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-outline" />
                  <span className="text-outline font-mono truncate max-w-[110px] sm:max-w-[200px]">
                    {incident.id}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {incident.externalUrl && (
              <a
                href={incident.externalUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 text-on-surface text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95"
              >
                <span>Official Feed</span>
                <ExternalLink className="w-3.5 h-3.5 text-primary" />
              </a>
            )}
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-1.5 rounded-xl bg-primary hover:bg-primary-fixed text-on-primary font-bold text-xs shadow-md shadow-primary/20 transition-all cursor-pointer active:scale-95 touch-manipulation"
            >
              Close Telemetry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

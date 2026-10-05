'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Layers, ShieldAlert } from 'lucide-react';
import type { DisasterEvent, DisasterType } from '../types/disaster';
import { HAZARD_CATEGORIES } from '../lib/hazardClassification';

interface MapLegendProps {
  incidents: DisasterEvent[];
}

export const MapLegend: React.FC<MapLegendProps> = ({ incidents }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'types' | 'severity'>('types');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close legend on outside tap/click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Count active incidents per category from actual data
  const activeCategories = useMemo(() => {
    const counts: Partial<Record<DisasterType, number>> = {};
    incidents.forEach((inc) => {
      counts[inc.type] = (counts[inc.type] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([type, count]) => ({
        type: type as DisasterType,
        count,
        meta: HAZARD_CATEGORIES[type as DisasterType],
      }))
      .filter((item) => item.meta && item.count > 0)
      .sort((a, b) => (b.count || 0) - (a.count || 0));
  }, [incidents]);

  return (
    <div ref={containerRef} className="relative flex flex-col items-end pointer-events-auto shrink-0">
      {/* Legend Toggle Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Toggle map legend"
        className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg bg-surface-container-low/95 backdrop-blur-md border border-outline-variant/40 hover:border-primary/50 text-on-surface text-xs font-label-mono-sm shadow-md transition-all group focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none"
        type="button"
        title="Toggle Map Legend"
      >
        <Layers className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform shrink-0" />
        <span className="font-semibold tracking-wider text-[10px] sm:text-[11px] text-on-surface uppercase">Legend</span>
        {activeCategories.length > 0 && !isOpen && (
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" />
        )}
        {isOpen ? (
          <ChevronUp className="w-3.5 h-3.5 text-outline group-hover:text-primary transition-colors shrink-0" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-outline group-hover:text-primary transition-colors shrink-0" />
        )}
      </button>

      {/* Expanded Legend Panel */}
      {isOpen && (
        <div
          className="absolute top-full right-0 mt-1.5 w-[min(280px,calc(100vw-3rem))] sm:w-72 bg-surface-container-lowest/95 backdrop-blur-md border border-outline-variant/35 rounded-xl p-3 shadow-2xl flex flex-col gap-2.5 animate-in fade-in slide-in-from-top-2 duration-150 z-40"
          role="region"
          aria-label="Map Legend Details"
        >
          {/* Subheader & Tabs */}
          <div className="flex items-center justify-between pb-1 border-b border-outline-variant/20">
            <span className="font-label-mono-sm text-[10px] text-outline uppercase tracking-wider font-semibold">
              Telemetry Legend
            </span>
            <div className="flex items-center gap-1 bg-surface-container-high/80 p-0.5 rounded-md">
              <button
                type="button"
                onClick={() => setActiveTab('types')}
                className={`px-2 py-0.5 rounded text-[10px] font-label-mono-sm transition-colors ${
                  activeTab === 'types'
                    ? 'bg-primary/20 text-primary font-semibold'
                    : 'text-outline hover:text-on-surface'
                }`}
              >
                Types
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('severity')}
                className={`px-2 py-0.5 rounded text-[10px] font-label-mono-sm transition-colors ${
                  activeTab === 'severity'
                    ? 'bg-primary/20 text-primary font-semibold'
                    : 'text-outline hover:text-on-surface'
                }`}
              >
                Severity
              </button>
            </div>
          </div>

          {/* TAB 1: EVENT CATEGORIES */}
          {activeTab === 'types' && (
            <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
              <div className="text-[10px] text-outline mb-0.5 flex justify-between">
                <span>Active Hazards on Map</span>
                <span className="tabular-nums font-mono">{incidents.length} events</span>
              </div>
              {activeCategories.length === 0 ? (
                <div className="py-2 text-center text-xs text-outline font-body-sm">
                  No active events in current filter
                </div>
              ) : (
                activeCategories.map(({ type, count, meta }) => (
                  <div
                    key={type}
                    className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-surface-container-high/40 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/40 shadow-sm"
                        style={{
                          backgroundColor: meta.color,
                        }}
                      />
                      <span className="text-xs text-on-surface truncate font-medium">
                        {meta.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className="text-[9px] font-label-mono-sm text-outline/80 px-1 py-0.5 rounded bg-surface-container-high/60"
                        title={`Operational window: ${meta.activeWindow}`}
                      >
                        {meta.activeWindow}
                      </span>
                      <span className="text-[10px] font-label-mono-sm px-1.5 py-0.5 rounded-full bg-surface-container-high text-outline tabular-nums">
                        {count}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: RISK / SEVERITY SYSTEM */}
          {activeTab === 'severity' && (
            <div className="flex flex-col gap-2">
              <div className="text-[10px] text-outline flex items-center justify-between">
                <span>Operational Severity Tiers</span>
                <ShieldAlert className="w-3 h-3 text-tertiary" />
              </div>

              {/* HIGH RISK */}
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-surface-container-low/60 border border-red-500/20">
                <div className="flex items-center gap-2">
                  <div className="relative w-4 h-4 flex items-center justify-center">
                    <span className="w-3.5 h-3.5 rounded-full bg-red-500/30 animate-ping absolute" />
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 relative" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-red-400">HIGH RISK</span>
                    <span className="text-[9px] text-outline">Critical incident &bull; 11px pulse</span>
                  </div>
                </div>
                <span className="text-[10px] font-label-mono-sm px-1.5 py-0.5 rounded bg-red-950/60 text-red-400 border border-red-500/30">
                  Critical
                </span>
              </div>

              {/* WARNING */}
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-surface-container-low/60 border border-amber-500/20">
                <div className="flex items-center gap-2">
                  <div className="relative w-4 h-4 flex items-center justify-center">
                    <span className="w-3 h-3 rounded-full bg-amber-500/30 animate-ping absolute" />
                    <span className="w-2 h-2 rounded-full bg-amber-500 relative" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-amber-400">WARNING</span>
                    <span className="text-[9px] text-outline">Significant event &bull; 9px pulse</span>
                  </div>
                </div>
                <span className="text-[10px] font-label-mono-sm px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-500/30">
                  High
                </span>
              </div>

              {/* MONITORING */}
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-surface-container-low/60 border border-sky-500/20">
                <div className="flex items-center gap-2">
                  <div className="relative w-4 h-4 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-sky-400">MONITORING</span>
                    <span className="text-[9px] text-outline">Active telemetry &bull; 7px dot</span>
                  </div>
                </div>
                <span className="text-[10px] font-label-mono-sm px-1.5 py-0.5 rounded bg-sky-950/60 text-sky-400 border border-sky-500/30">
                  Medium
                </span>
              </div>

              {/* SAFE / LOW */}
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-surface-container-low/60 border border-outline-variant/20">
                <div className="flex items-center gap-2">
                  <div className="relative w-4 h-4 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-slate-300">SAFE / LOW</span>
                    <span className="text-[9px] text-outline">Minor / ambient &bull; 6px dot</span>
                  </div>
                </div>
                <span className="text-[10px] font-label-mono-sm px-1.5 py-0.5 rounded bg-slate-800/60 text-slate-400 border border-slate-700/40">
                  Low
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

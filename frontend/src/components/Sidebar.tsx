'use client';

import React from 'react';
import { Radio } from 'lucide-react';
import type { DisasterType, RegionFocus } from '../types/disaster';
import { REGION_THEATERS } from '../types/disaster';
import type { CategoryCounts } from '../services/disasterService';

interface SidebarProps {
  activeDomain: 'all' | DisasterType;
  counts: CategoryCounts;
  onSelectDomain: (domain: 'all' | DisasterType) => void;
  activeRegion: RegionFocus;
  onSelectRegion: (region: RegionFocus) => void;
  regionCounts: Record<string, number>;
  activeView: 'radar' | 'risk';
  onSelectView: (view: 'radar' | 'risk') => void;
  /** Mobile slide-over drawer state (ignored on desktop). */
  mobileOpen?: boolean;
  onClose?: () => void;
}

/** Categories that currently have no open, verifiable global real-time feed. */
const FEEDLESS_TYPES: DisasterType[] = ['TORNADO', 'AVALANCHE', 'SOLAR_STORM', 'EPIDEMIC'];

export const Sidebar: React.FC<SidebarProps> = ({
  activeDomain,
  counts,
  onSelectDomain,
  activeRegion,
  onSelectRegion,
  regionCounts,
  activeView,
  onSelectView,
  mobileOpen = false,
  onClose = () => {},
}) => {
  const DomainButton = ({
    domain,
    label,
    count,
  }: {
    domain: 'all' | DisasterType;
    label: string;
    count: number;
  }) => {
    const feedless = domain !== 'all' && FEEDLESS_TYPES.includes(domain);
    const isActive = activeDomain === domain && activeView !== 'risk';

    return (
      <button
        onClick={() => {
          onSelectView('radar');
          onSelectDomain(domain);
        }}
        className={`px-3 py-2 rounded-lg transition-all font-body-md text-body-md text-left flex justify-between items-center focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none ${
          isActive
            ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
            : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
        } ${feedless && !isActive ? 'opacity-50' : ''}`}
        type="button"
        title={
          feedless
            ? 'No open global real-time feed is available for this category yet.'
            : undefined
        }
      >
        <span className="truncate">{label}</span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-label-mono-sm shrink-0 tabular-nums ml-2 ${
            isActive
              ? 'bg-on-primary-container/20 text-on-primary-container'
              : 'bg-surface-container-highest text-on-surface-variant'
          }`}
        >
          {feedless ? '—' : count}
        </span>
      </button>
    );
  };

  const RegionButton = ({
    region,
    label,
    count,
  }: {
    region: RegionFocus;
    label: string;
    count: number;
  }) => {
    const isSelected = activeRegion === region || (region === 'SOUTH_ASIA' && activeRegion === 'INDIA');
    return (
      <button
        onClick={() => onSelectRegion(region)}
        className={`px-3 py-1.5 rounded-lg transition-all font-body-md text-sm text-left flex justify-between items-center focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none border cursor-pointer ${
          isSelected
            ? 'bg-surface-container-high text-on-surface border-primary/40 font-semibold shadow-sm'
            : 'border-transparent text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
        }`}
        type="button"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
              isSelected ? 'bg-primary animate-pulse' : 'bg-outline-variant/60'
            }`}
          />
          <span className="truncate">{label}</span>
        </div>
        <span
          className={`text-[11px] px-2 py-0.5 rounded-full font-label-mono-sm shrink-0 tabular-nums ml-2 ${
            isSelected
              ? 'bg-primary/15 text-primary border border-primary/20 font-medium'
              : 'bg-surface-container-highest text-on-surface-variant'
          }`}
        >
          {count}
        </span>
      </button>
    );
  };

  const renderContent = () => (
    <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 flex flex-col gap-5 custom-scrollbar min-h-0">
      {/* Overview Section */}
      <div className="flex flex-col gap-1">
        <div className="px-2 py-1">
          <span className="font-label-mono-sm text-label-mono-sm text-outline uppercase tracking-widest font-semibold">
            Overview
          </span>
        </div>
        <nav className="flex flex-col gap-1" aria-label="Overview Navigation">
          <DomainButton domain="all" label="All Disasters" count={counts.all} />

          {/* Enhanced Nearby Alerts Action Button */}
          <button
            onClick={() => onSelectView('risk')}
            className={`px-3 py-2 rounded-lg transition-all font-body-md text-body-md text-left flex items-center justify-between group border focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none cursor-pointer ${
              activeView === 'risk'
                ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm border-transparent'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface border-outline-variant/20 hover:border-primary/40 bg-surface-container-low/40'
            }`}
            type="button"
            title="View local alerts and risk telemetry relative to your current location"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Radio
                className={`w-3.5 h-3.5 shrink-0 ${
                  activeView === 'risk'
                    ? 'text-on-primary-container animate-pulse'
                    : 'text-primary group-hover:scale-110 transition-transform'
                }`}
              />
              <span className="truncate font-medium">Nearby Alerts</span>
            </div>
            <span
              className={`text-[10px] uppercase font-label-mono-sm px-1.5 py-0.5 rounded tracking-wider font-semibold ml-2 ${
                activeView === 'risk'
                  ? 'bg-on-primary-container/20 text-on-primary-container'
                  : 'bg-primary/10 text-primary border border-primary/20'
              }`}
            >
              Local
            </span>
          </button>
        </nav>
      </div>

      {/* Geographic Focus Section */}
      <div className="flex flex-col gap-1">
        <div className="px-2 py-1">
          <span className="font-label-mono-sm text-label-mono-sm text-outline uppercase tracking-widest font-semibold">
            Regions &amp; Theaters
          </span>
        </div>
        <nav className="flex flex-col gap-1" aria-label="Region Filters">
          {REGION_THEATERS.map((theater) => (
            <RegionButton
              key={theater.id}
              region={theater.id}
              label={theater.label}
              count={regionCounts[theater.id] ?? 0}
            />
          ))}
        </nav>
      </div>

      {/* Hazard Categories Section */}
      <div className="flex flex-col gap-1">
        <div className="px-2 py-1">
          <span className="font-label-mono-sm text-label-mono-sm text-outline uppercase tracking-widest font-semibold">
            Categories
          </span>
        </div>
        <nav className="flex flex-col gap-1" aria-label="Hazard Categories">
          <DomainButton domain="EARTHQUAKE" label="Earthquakes" count={counts.earthquake} />
          <DomainButton domain="WILDFIRE" label="Wildfires" count={counts.wildfire} />
          <DomainButton domain="CYCLONE" label="Cyclones" count={counts.cyclone} />
          <DomainButton domain="FLOOD" label="Floods" count={counts.flood} />
          <DomainButton domain="TSUNAMI" label="Tsunamis" count={counts.tsunami} />
          <DomainButton domain="VOLCANO" label="Volcanoes" count={counts.volcano} />
          <DomainButton domain="LANDSLIDE" label="Landslides" count={counts.landslide} />
          <DomainButton domain="HEATWAVE" label="Heatwaves" count={counts.heatwave} />
          <DomainButton domain="BLIZZARD" label="Blizzards" count={counts.blizzard} />
          <DomainButton domain="DROUGHT" label="Droughts" count={counts.drought} />
          <DomainButton domain="TORNADO" label="Tornadoes" count={counts.tornado} />
          <DomainButton domain="AVALANCHE" label="Avalanches" count={counts.avalanche} />
          <DomainButton domain="SOLAR_STORM" label="Solar Storms" count={counts.solarStorm} />
          <DomainButton domain="EPIDEMIC" label="Epidemics" count={counts.epidemic} />
        </nav>
        <p className="px-2 text-[10px] leading-relaxed text-outline mt-3 pb-16">
          Counts shown as — have no open global real-time feed yet.
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: persistent rail */}
      <aside className="fixed left-0 top-16 bottom-0 w-64 bg-surface-container-lowest z-40 hidden md:flex flex-col border-r border-outline-variant/20 select-none">
        {renderContent()}
      </aside>

      {/* Mobile: slide-over drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-[80]">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={onClose}
            className="absolute inset-0 w-full bg-black/60 backdrop-blur-sm cursor-pointer"
          />
          <aside className="absolute left-0 top-0 bottom-0 w-[82%] max-w-xs bg-surface-container-lowest border-r border-outline-variant/30 flex flex-col py-panel-padding-standard shadow-2xl">
            <div className="flex items-center justify-between px-panel-padding-tight pb-2 border-b border-outline-variant/20 shrink-0">
              <span className="font-label-mono-sm text-label-mono-sm text-outline uppercase tracking-widest font-semibold">
                Navigation
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close navigation"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-hidden min-h-0 pt-2">
              {renderContent()}
            </div>
          </aside>
        </div>
      )}
    </>
  );
};

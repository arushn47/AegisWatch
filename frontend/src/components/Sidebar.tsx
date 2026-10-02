'use client';

import React from 'react';
import type { DisasterType } from '../types/disaster';

interface FilterCounts {
  all: number;
  earthquake: number;
  wildfire: number;
  cyclone: number;
  flood: number;
  tsunami: number;
  volcano: number;
  landslide: number;
  heatwave: number;
  blizzard: number;
  drought: number;
}

interface SidebarProps {
  activeDomain: 'all' | DisasterType;
  counts: FilterCounts;
  onSelectDomain: (domain: 'all' | DisasterType) => void;
  activeView: 'radar' | 'risk';
  onSelectView: (view: 'radar' | 'risk') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeDomain,
  counts,
  onSelectDomain,
  activeView,
  onSelectView,
}) => {
  
  const DomainButton = ({ domain, label, count }: { domain: 'all' | DisasterType, label: string, count: number }) => (
    <button
      onClick={() => {
        onSelectView('radar');
        onSelectDomain(domain);
      }}
      className={`px-gutter-md py-gutter-sm rounded-lg transition-colors font-body-md text-body-md text-left flex justify-between items-center ${
        activeDomain === domain
          ? 'bg-primary-container text-on-primary-container font-semibold'
          : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
      }`}
      type="button"
    >
      <span>{label}</span>
      <span className={`text-xs px-2 py-0.5 rounded-full font-label-mono-sm ${
        activeDomain === domain ? 'bg-on-primary-container/20 text-on-primary-container' : 'bg-surface-container-highest text-on-surface-variant'
      }`}>
        {count}
      </span>
    </button>
  );

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-surface-container-lowest z-40 hidden md:flex flex-col justify-between py-panel-padding-standard overflow-y-auto border-r border-outline-variant/20 custom-scrollbar">
      <div className="flex flex-col gap-module-gap px-panel-padding-tight">
        
        <div className="flex flex-col gap-gutter-xs">
          <div className="px-gutter-sm py-gutter-xs">
            <span className="font-label-mono-sm text-label-mono-sm text-outline uppercase tracking-widest">
              Overview
            </span>
          </div>
          <nav className="flex flex-col gap-gutter-xs">
            <DomainButton domain="all" label="All Disasters" count={counts.all} />
            <button
              onClick={() => onSelectView('risk')}
              className={`px-gutter-md py-gutter-sm rounded-lg transition-colors font-body-md text-body-md text-left ${
                activeView === 'risk'
                  ? 'bg-primary-container text-on-primary-container font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
              type="button"
            >
              Nearby Alerts
            </button>
          </nav>
        </div>

        <div className="flex flex-col gap-gutter-xs">
          <div className="px-gutter-sm py-gutter-xs">
            <span className="font-label-mono-sm text-label-mono-sm text-outline uppercase tracking-widest">
              Categories
            </span>
          </div>
          <nav className="flex flex-col gap-gutter-xs">
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
          </nav>
        </div>
      </div>
    </aside>
  );
};

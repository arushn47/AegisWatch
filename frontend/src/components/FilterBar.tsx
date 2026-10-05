'use client';

import React, { useMemo } from 'react';
import type { DisasterType, RegionFocus } from '../types/disaster';
import { HAZARD_CATEGORIES } from '../lib/hazardClassification';

interface FilterBarProps {
  activeDomain?: 'all' | DisasterType;
  activeRegion?: RegionFocus;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  activeDomain = 'all',
  activeRegion = 'GLOBAL',
}) => {
  const title = useMemo(() => {
    let regionPrefix = 'Global';
    if (activeRegion === 'AMERICAS') regionPrefix = 'Americas';
    else if (activeRegion === 'EUROPE') regionPrefix = 'Europe';
    else if (activeRegion === 'ASIA_PACIFIC') regionPrefix = 'Asia-Pacific';
    else if (activeRegion === 'SOUTH_ASIA' || activeRegion === 'INDIA') regionPrefix = 'South Asia · India';
    else if (activeRegion === 'AFRICA_ME') regionPrefix = 'Africa & Middle East';

    if (activeDomain === 'all') {
      return `${regionPrefix} Disaster Map`;
    }
    const catName = HAZARD_CATEGORIES[activeDomain]?.label || activeDomain;
    return `${catName}s — ${regionPrefix} Map`;
  }, [activeDomain, activeRegion]);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full pb-0.5">
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="font-label-mono-sm text-xs uppercase tracking-widest text-primary font-semibold">
            Live Updates
          </span>
          <span className="inline-block w-2 h-2 rounded-full bg-primary animate-ping" />
        </div>
        <h1 className="font-headline-lg text-2xl lg:text-3xl text-on-surface font-bold tracking-tight mt-0.5">
          {title}
        </h1>
      </div>
    </div>
  );
};

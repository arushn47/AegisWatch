'use client';

import React from 'react';
import { Flame, Activity, Wind, Waves } from 'lucide-react';
import type { GlobalSensorStats, DisasterType } from '../types/disaster';

interface KPIBannerProps {
  stats: GlobalSensorStats;
  onFilterType: (type: DisasterType) => void;
}

export const KPIBanner: React.FC<KPIBannerProps> = ({ stats, onFilterType }) => {
  return (
    <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
      {/* Active Fires */}
      <button
        onClick={() => onFilterType('WILDFIRE')}
        className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 transition-all text-left group shadow-sm"
        type="button"
      >
        <div className="w-10 h-10 rounded-lg bg-secondary-container/20 border border-secondary-container/40 flex items-center justify-center text-secondary group-hover:scale-105 transition-transform flex-shrink-0">
          <Flame className="w-5 h-5 text-secondary" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-headline-md text-xl font-bold text-on-surface tabular-nums">
            {stats.activeFires}
          </span>
          <span className="font-body-sm text-xs text-on-surface-variant truncate">
            Active Fires
          </span>
        </div>
      </button>

      {/* >M5.0 Quakes */}
      <button
        onClick={() => onFilterType('EARTHQUAKE')}
        className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 transition-all text-left group shadow-sm"
        type="button"
      >
        <div className="w-10 h-10 rounded-lg bg-[#c2692a]/20 border border-[#c2692a]/40 flex items-center justify-center text-[#c2692a] group-hover:scale-105 transition-transform flex-shrink-0">
          <Activity className="w-5 h-5 text-[#c2692a]" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-headline-md text-xl font-bold text-on-surface tabular-nums">
            {stats.significantQuakes}
          </span>
          <span className="font-body-sm text-xs text-on-surface-variant truncate">
            &gt;M4.5 Quakes
          </span>
        </div>
      </button>

      {/* Tropical Storms */}
      <button
        onClick={() => onFilterType('CYCLONE')}
        className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 transition-all text-left group shadow-sm"
        type="button"
      >
        <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center text-primary group-hover:scale-105 transition-transform flex-shrink-0">
          <Wind className="w-5 h-5 text-primary" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-headline-md text-xl font-bold text-on-surface tabular-nums">
            {stats.tropicalStorms}
          </span>
          <span className="font-body-sm text-xs text-on-surface-variant truncate">
            Tropical Storms
          </span>
        </div>
      </button>

      {/* Major Floods */}
      <button
        onClick={() => onFilterType('FLOOD')}
        className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 transition-all text-left group shadow-sm"
        type="button"
      >
        <div className="w-10 h-10 rounded-lg bg-surface-tint/20 border border-surface-tint/40 flex items-center justify-center text-surface-tint group-hover:scale-105 transition-transform flex-shrink-0">
          <Waves className="w-5 h-5 text-surface-tint" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-headline-md text-xl font-bold text-on-surface tabular-nums">
            {stats.majorFloods}
          </span>
          <span className="font-body-sm text-xs text-on-surface-variant truncate">
            Major Floods
          </span>
        </div>
      </button>
    </section>
  );
};

'use client';

import React from 'react';
import { Flame, Activity, Wind, Waves } from 'lucide-react';
import type { GlobalSensorStats, DisasterType } from '../types/disaster';
import { AnimatedNumber, useStaggerIn } from '../lib/motion';

interface KPIBannerProps {
  stats: GlobalSensorStats;
  onFilterType: (type: DisasterType) => void;
}

interface MetricSpec {
  type: DisasterType;
  label: string;
  value: number;
  Icon: React.ElementType;
  /** Top accent bar + icon tint for this hazard domain. */
  accent: string;
  iconWrap: string;
  hover: string;
}

export const KPIBanner: React.FC<KPIBannerProps> = ({ stats, onFilterType }) => {
  const gridRef = useStaggerIn<HTMLElement>(stats.activeFires + stats.significantQuakes + stats.tropicalStorms + stats.majorFloods > 0, {
    y: 12,
    stagger: 0.06,
  });

  const metrics: MetricSpec[] = [
    {
      type: 'WILDFIRE',
      label: 'Active Fires',
      value: stats.activeFires,
      Icon: Flame,
      accent: 'bg-secondary',
      iconWrap: 'bg-secondary-container/20 border-secondary-container/40 text-secondary',
      hover: 'hover:border-secondary/40',
    },
    {
      type: 'EARTHQUAKE',
      label: '>M4.5 Quakes',
      value: stats.significantQuakes,
      Icon: Activity,
      accent: 'bg-[#c2692a]',
      iconWrap: 'bg-[#c2692a]/20 border-[#c2692a]/40 text-[#c2692a]',
      hover: 'hover:border-[#c2692a]/40',
    },
    {
      type: 'CYCLONE',
      label: 'Tropical Storms',
      value: stats.tropicalStorms,
      Icon: Wind,
      accent: 'bg-primary',
      iconWrap: 'bg-primary/20 border-primary/40 text-primary',
      hover: 'hover:border-primary/40',
    },
    {
      type: 'FLOOD',
      label: 'Major Floods',
      value: stats.majorFloods,
      Icon: Waves,
      accent: 'bg-[#38bdf8]',
      iconWrap: 'bg-[#38bdf8]/20 border-[#38bdf8]/40 text-[#38bdf8]',
      hover: 'hover:border-[#38bdf8]/40',
    },
  ];

  return (
    <section ref={gridRef} className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
      {metrics.map(({ type, label, value, Icon, accent, iconWrap, hover }) => (
        <button
          key={type}
          onClick={() => onFilterType(type)}
          className={`relative flex items-center gap-3 p-3 rounded-lg bg-surface-container-low border border-outline-variant/30 transition-all text-left group shadow-sm overflow-hidden hover:bg-surface-container hover:-translate-y-0.5 ${hover}`}
          type="button"
        >
          {/* Hazard accent bar */}
          <span className={`absolute top-0 left-0 right-0 h-[2px] ${accent} opacity-70`} aria-hidden="true" />

          <div className={`w-10 h-10 rounded-md border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${iconWrap}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <AnimatedNumber
              value={value}
              className="font-headline-md text-xl font-bold text-on-surface tabular-nums leading-none"
            />
            <span className="font-label-mono-sm text-[10px] uppercase tracking-wider text-on-surface-variant truncate mt-1.5">
              {label}
            </span>
          </div>
        </button>
      ))}
    </section>
  );
};

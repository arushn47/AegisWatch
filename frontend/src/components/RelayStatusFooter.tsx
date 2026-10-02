'use client';

import React from 'react';
import Link from 'next/link';
import { Satellite, Radio } from 'lucide-react';

export const RelayStatusFooter: React.FC = () => {
  return (
    <footer className="flex flex-col gap-3 w-full pt-3 pb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
        {/* Sentinel & Landsat Relays */}
        <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-surface-container border border-primary/30 flex items-center justify-center text-primary flex-shrink-0">
              <Satellite className="w-5 h-5 text-primary" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-headline-sm text-sm font-semibold text-on-surface truncate">
                Sentinel &amp; Landsat Relays Active
              </span>
              <span className="font-body-sm text-xs text-on-surface-variant truncate">
                Mean sensor refresh rate 94.2s across primary coverage zones
              </span>
            </div>
          </div>
          <span className="font-label-mono-sm text-xs text-primary font-bold hidden sm:inline-block px-2.5 py-1 rounded bg-primary/10 border border-primary/20 flex-shrink-0">
            99.98% SYNC
          </span>
        </div>

        {/* Civil Protection Broadcast Net */}
        <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-surface-container border border-tertiary/30 flex items-center justify-center text-tertiary flex-shrink-0">
              <Radio className="w-5 h-5 text-tertiary animate-pulse" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-headline-sm text-sm font-semibold text-on-surface truncate">
                Civil Protection Broadcast Net
              </span>
              <span className="font-body-sm text-xs text-on-surface-variant truncate">
                Instant localized push alerts operational for municipal agencies
              </span>
            </div>
          </div>
          <span className="font-label-mono-sm text-xs text-tertiary font-bold hidden sm:inline-block px-2.5 py-1 rounded bg-tertiary/10 border border-tertiary/20 flex-shrink-0">
            READY
          </span>
        </div>
      </div>
      
      {/* Footer bottom row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-1 px-1">
        <div className="text-[10px] text-on-surface-variant/50 font-label-mono-sm uppercase tracking-wider text-center sm:text-left">
          Mapping powered by <a href="https://leafletjs.com/" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors underline decoration-on-surface-variant/30 underline-offset-2">Leaflet</a> | &copy; Esri &bull; OpenStreetMap
        </div>
        <Link
          href="/resources"
          className="text-[11px] font-medium text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1.5 px-3 py-1 rounded-full border border-outline-variant/30 hover:border-primary/30 bg-surface-container"
        >
          <span>??</span> Resources & Data Sources
        </Link>
      </div>
    </footer>
  );
};

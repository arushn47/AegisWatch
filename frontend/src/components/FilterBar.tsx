'use client';

import React from 'react';

export const FilterBar: React.FC = () => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 w-full">
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="font-label-mono-sm text-xs uppercase tracking-widest text-primary font-semibold">
            Live Updates
          </span>
          <span className="inline-block w-2 h-2 rounded-full bg-primary animate-ping"></span>
        </div>
        <h1 className="font-headline-lg text-2xl lg:text-3xl text-on-surface font-bold tracking-tight mt-0.5">
          Global Disaster Map
        </h1>
      </div>
    </div>
  );
};

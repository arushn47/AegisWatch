'use client';

import React from 'react';
import Image from 'next/image';

interface HeaderProps {
  unreadCount: number;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
  onOpenAuth: () => void;
  user: any | null;
}

export const Header: React.FC<HeaderProps> = ({
  unreadCount,
  onOpenNotifications,
  onOpenSettings,
  onOpenProfile,
  onOpenAuth,
  user
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/20">
      <div className="h-16 w-full px-grid-margin-desktop flex items-center justify-between gap-gutter-md">
        {/* Logo & Platform Titles */}
        <div className="flex items-center gap-gutter-md">
          <Image alt="Aegis Watch Logo" width={36} height={36} className="rounded-lg object-cover ring-1 ring-primary/40 shadow-sm shadow-primary/20" src="/logo.png" priority />
          <div className="flex flex-col">
            <span className="font-headline-sm text-headline-sm uppercase text-on-surface tracking-wider font-semibold">
              AEGIS WATCH
            </span>
            <span className="font-label-mono-sm text-label-mono-sm text-primary uppercase font-medium">
              GLOBAL SENSOR NET
            </span>
          </div>
        </div>

        {/* Status Pill & Action Buttons */}
        <div className="flex items-center gap-gutter-lg">
          <div className="hidden md:flex items-center gap-gutter-sm px-gutter-md py-gutter-xs bg-surface-container-low rounded-full border border-outline-variant/30">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
            <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant font-medium">
              SYSTEM OPERATIONAL
            </span>
            <span className="h-3 w-px bg-surface-variant"></span>
            <span className="font-label-mono-sm text-label-mono-sm text-primary font-semibold">
              LIVE TELEMETRY ACTIVE
            </span>
          </div>

          <div className="flex items-center gap-gutter-xs">
            <button
              onClick={onOpenNotifications}
              className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors"
              type="button"
              title="Notifications"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] px-1 h-4 rounded-full bg-[#ff1100] text-white text-[10px] shadow-sm font-label-mono-sm font-bold flex items-center justify-center border-2 border-surface-container box-content">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            <div className="flex items-center pl-gutter-xs">
              <button
                onClick={user ? onOpenProfile : onOpenAuth}
                type="button"
                className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-primary font-label-mono-md text-label-mono-md font-bold hover:bg-primary hover:text-on-primary transition-colors shadow-[0_0_10px_rgba(0,0,0,0.5)] cursor-pointer"
                title={user ? "User Profile" : "Login / Sign Up"}
              >
                {user ? (user.email ? user.email.substring(0, 2).toUpperCase() : 'AW') : 'IN'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

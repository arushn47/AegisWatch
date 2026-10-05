'use client';

import React from 'react';
import Image from 'next/image';

interface HeaderProps {
  unreadCount: number;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
  onOpenAuth: () => void;
  onOpenMenu?: () => void;
  onSimulateAlert?: () => void;
  user: any | null;
}

export const Header: React.FC<HeaderProps> = ({
  unreadCount,
  onOpenNotifications,
  onOpenProfile,
  onOpenAuth,
  onOpenMenu,
  onSimulateAlert,
  user,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/20 select-none">
      <div className="h-16 w-full px-4 md:px-grid-margin-desktop flex items-center justify-between gap-3">
        {/* Logo & Platform Titles */}
        <div className="flex items-center gap-2.5 md:gap-gutter-md min-w-0">
          {onOpenMenu && (
            <button
              onClick={onOpenMenu}
              className="md:hidden shrink-0 w-9 h-9 -ml-1 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              title="Open navigation"
              aria-label="Open navigation"
              type="button"
            >
              <span className="material-symbols-outlined text-[22px]">menu</span>
            </button>
          )}
          <Image
            alt="Aegis Watch Logo"
            width={34}
            height={34}
            className="rounded-lg object-cover ring-1 ring-primary/40 shadow-sm shadow-primary/20 shrink-0"
            src="/logo.png"
            priority
          />
          <div className="flex flex-col min-w-0">
            <span className="font-headline-sm text-headline-sm uppercase text-on-surface tracking-wider font-semibold truncate leading-tight">
              AEGIS WATCH
            </span>
            <span className="font-label-mono-sm text-[10px] text-primary uppercase font-medium truncate tracking-widest hidden sm:block">
              GLOBAL SENSOR NET
            </span>
          </div>
        </div>

        {/* Refined Top-Right Status & User Action Area */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Status Group: [● SYSTEM OPERATIONAL] [LIVE TELEMETRY] */}
          <div className="hidden lg:flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container-low/90 rounded-full border border-outline-variant/30 text-on-surface-variant font-label-mono-sm text-[11px]">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="font-medium tracking-wide">SYSTEM OPERATIONAL</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container-low/90 rounded-full border border-primary/30 text-primary font-label-mono-sm text-[11px] shadow-sm shadow-primary/10">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              <span className="font-semibold tracking-wide">LIVE TELEMETRY</span>
            </div>
          </div>

          {/* Medium screen compact fallback */}
          <div className="hidden md:flex lg:hidden items-center gap-1.5 px-2.5 py-1 bg-surface-container-low/90 rounded-full border border-outline-variant/30 text-on-surface-variant font-label-mono-sm text-[11px]">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse shrink-0" />
            <span className="font-medium tracking-wide">LIVE TELEMETRY</span>
          </div>

          {/* Vertical Separator */}
          <div className="hidden md:block w-px h-5 bg-outline-variant/30 mx-0.5" />

          {/* User Controls: Demo Alert, Notifications & Profile */}
          <div className="flex items-center gap-2">
            {onSimulateAlert && (
              <button
                onClick={onSimulateAlert}
                type="button"
                title="Trigger simulated disaster alert (for project demo & evaluation)"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-primary/15 hover:bg-primary/25 border border-primary/35 hover:border-primary/60 text-primary transition-all font-label-mono-sm text-xs font-semibold cursor-pointer shadow-sm active:scale-95 shrink-0"
              >
                <span className="material-symbols-outlined text-[16px] text-primary">
                  bolt
                </span>
                <span className="hidden sm:inline">Demo Alert</span>
              </button>
            )}

            <button
              onClick={onOpenNotifications}
              className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/35 hover:border-primary/50 text-on-surface-variant hover:text-on-surface transition-all focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none cursor-pointer shadow-sm"
              type="button"
              title="Notifications"
              aria-label={
                unreadCount > 0
                  ? `${unreadCount} unread alert notifications`
                  : 'Notifications'
              }
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] px-1 h-4 rounded-full bg-[#ff2a1b] text-white text-[10px] font-label-mono-sm font-bold flex items-center justify-center border border-surface-container-lowest shadow-md tabular-nums">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={user ? onOpenProfile : onOpenAuth}
              type="button"
              className="w-9 h-9 rounded-full bg-surface-container-high ring-1 ring-outline-variant/40 hover:ring-primary/60 transition-all flex items-center justify-center text-primary font-label-mono-sm text-xs font-bold shadow-[0_0_10px_rgba(0,0,0,0.5)] cursor-pointer overflow-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none shrink-0"
              title={user ? 'User Profile' : 'Login / Sign Up'}
              aria-label={user ? 'User Profile' : 'Login or Sign Up'}
            >
              {user?.user_metadata?.avatar_url || user?.user_metadata?.picture ? (
                <img
                  src={user.user_metadata.avatar_url || user.user_metadata.picture}
                  alt="User Avatar"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : user?.email ? (
                user.email.substring(0, 2).toUpperCase()
              ) : (
                'IN'
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

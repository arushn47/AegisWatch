'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BellRing,
  CheckCheck,
  Clock,
  ExternalLink,
  Flame,
  Info,
  MonitorSmartphone,
  Radio,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import type { NotificationRow } from '../lib/notifications';
import { formatRelativeIso } from '../lib/relativeTime';
import { getPopupDeliveryState } from '../lib/pwa';

interface NotificationCenterModalProps {
  notifications: NotificationRow[];
  onClose: () => void;
  onMarkAllRead: () => void;
  onClearAll?: () => void;
  onSimulateAlert?: () => void;
  loading?: boolean;
}

type FilterTab = 'all' | 'unread' | 'high_priority';

const SEVERITY_STYLE: Record<
  string,
  {
    bar: string;
    chip: string;
    label: string;
    icon: React.ReactNode;
  }
> = {
  CRITICAL: {
    bar: 'bg-gradient-to-b from-error via-red-500 to-rose-600 shadow-sm shadow-error/30',
    chip: 'bg-error/15 text-error border-error/30',
    label: 'CRITICAL',
    icon: <Flame size={12} className="shrink-0" />,
  },
  HIGH: {
    bar: 'bg-gradient-to-b from-tertiary via-amber-500 to-orange-500 shadow-sm shadow-tertiary/30',
    chip: 'bg-tertiary/15 text-tertiary border-tertiary/30',
    label: 'HIGH',
    icon: <AlertTriangle size={12} className="shrink-0" />,
  },
  MEDIUM: {
    bar: 'bg-gradient-to-b from-primary via-cyan-400 to-blue-500 shadow-sm shadow-primary/30',
    chip: 'bg-primary/15 text-primary border-primary/30',
    label: 'MODERATE',
    icon: <Info size={12} className="shrink-0" />,
  },
  LOW: {
    bar: 'bg-outline/40',
    chip: 'bg-surface-container-highest text-on-surface-variant border-outline-variant/30',
    label: 'ADVISORY',
    icon: <ShieldCheck size={12} className="shrink-0" />,
  },
};

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  notifications,
  onClose,
  onMarkAllRead,
  onClearAll,
  loading = false,
}) => {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const unreadCount = useMemo(() => notifications.filter((n) => !n.is_read).length, [notifications]);
  const highPriorityCount = useMemo(
    () =>
      notifications.filter((n) => {
        const lvl = (n.risk_level || '').toUpperCase();
        return lvl === 'CRITICAL' || lvl === 'HIGH';
      }).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    if (activeTab === 'unread') {
      return notifications.filter((n) => !n.is_read);
    }
    if (activeTab === 'high_priority') {
      return notifications.filter((n) => {
        const lvl = (n.risk_level || '').toUpperCase();
        return lvl === 'CRITICAL' || lvl === 'HIGH';
      });
    }
    return notifications;
  }, [notifications, activeTab]);

  // Read-only snapshot of the current popup delivery state (for the status indicator).
  // Toggle controls live exclusively in Settings > Notifications.
  const popupDeliveryState = typeof window !== 'undefined' ? getPopupDeliveryState() : 'muted';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-md p-0 sm:p-4 select-none animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full h-[90vh] sm:h-[85vh] sm:max-h-[760px] sm:max-w-xl bg-surface-container border-t sm:border border-outline-variant/30 rounded-t-3xl sm:rounded-2xl shadow-2xl relative overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
        {/* Top ambient tactical glow line */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-80 z-20" />

        {/* Mobile slide grab indicator */}
        <div className="pt-2.5 pb-1 flex justify-center sm:hidden shrink-0">
          <div className="w-12 h-1.5 bg-outline-variant/40 rounded-full" />
        </div>

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-outline-variant/20 relative z-10 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shadow-sm shadow-primary/10 shrink-0">
                <BellRing
                  size={20}
                  className={unreadCount > 0 ? 'text-primary animate-pulse' : 'text-primary'}
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base sm:text-lg font-bold text-on-surface tracking-tight font-headline-md">
                    Notification Centre
                  </h1>
                  {unreadCount > 0 ? (
                    <span className="px-2 py-0.5 text-[10px] font-bold font-label-mono-sm rounded-full bg-primary/20 text-primary border border-primary/30 animate-pulse">
                      {unreadCount} Unread
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] font-medium font-label-mono-sm rounded-full bg-surface-container-highest text-outline border border-outline-variant/20">
                      All Caught Up
                    </span>
                  )}
                </div>
                <p className="text-xs text-on-surface-variant font-body-sm line-clamp-1 mt-0.5">
                  Automated hazard dispatch tailored to your alert preferences
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-surface-container-high/80 hover:bg-surface-container-highest border border-outline-variant/30 flex items-center justify-center text-outline hover:text-on-surface transition-colors active:scale-95 shrink-0"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          {/* Filter tabs & bulk actions bar */}
          {notifications.length > 0 && (
            <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-outline-variant/15 flex-wrap">
              <div className="flex items-center gap-1.5 p-1 bg-surface-container-low rounded-lg border border-outline-variant/20">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                    activeTab === 'all'
                      ? 'bg-surface-container-highest text-on-surface shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  onClick={() => setActiveTab('unread')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                    activeTab === 'unread'
                      ? 'bg-surface-container-highest text-primary shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Unread ({unreadCount})
                </button>
                {highPriorityCount > 0 && (
                  <button
                    onClick={() => setActiveTab('high_priority')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                      activeTab === 'high_priority'
                        ? 'bg-surface-container-highest text-error shadow-xs'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Critical / High ({highPriorityCount})
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllRead}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/25 text-on-surface-variant hover:text-on-surface transition-colors text-xs font-medium cursor-pointer active:scale-95"
                    title="Mark all notifications as read"
                  >
                    <CheckCheck size={14} className="text-primary" />
                    <span>Mark all read</span>
                  </button>
                )}
                {onClearAll && (
                  <button
                    onClick={onClearAll}
                    title="Delete all notifications"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-error/10 hover:bg-error/20 border border-error/20 text-error transition-colors text-xs font-medium cursor-pointer active:scale-95"
                  >
                    <Trash2 size={13} />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Body / Alerts List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar relative z-10">
          {loading && (
            <div className="h-full flex flex-col items-center justify-center py-16 text-center text-on-surface-variant gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-xs font-label-mono-sm tracking-wider uppercase">
                Synchronizing live alert feed...
              </p>
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center py-8 sm:py-12 px-4 text-center">
              {/* Tactical Radar Concentric Pulse Illustration */}
              <div className="relative flex items-center justify-center mb-6">
                <div
                  className="absolute w-36 h-36 rounded-full border border-primary/10 animate-ping opacity-25"
                  style={{ animationDuration: '3.5s' }}
                />
                <div className="absolute w-28 h-28 rounded-full border border-primary/20" />
                <div className="absolute w-20 h-20 rounded-full border border-primary/30 bg-primary/5" />
                <div className="relative w-14 h-14 rounded-2xl bg-surface-container-high border border-primary/40 flex items-center justify-center text-primary shadow-lg shadow-primary/15">
                  <Radio size={24} className="text-primary animate-pulse" />
                </div>
              </div>

              {/* Status Chip */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-label-mono-sm font-semibold bg-primary/10 text-primary border border-primary/25 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                ACTIVE SURVEILLANCE STANDBY
              </div>

              {/* Headline */}
              <h2 className="text-base sm:text-lg font-bold text-on-surface tracking-tight font-headline-md mb-2">
                No Active Hazard Alerts
              </h2>

              {/* Description */}
              <p className="text-xs sm:text-sm text-on-surface-variant max-w-md leading-relaxed font-body-sm mb-6">
                Your monitored sectors are currently clear. When an earthquake, storm, or thermal
                anomaly matches your saved alert preferences and locations, it will dispatch here
                instantaneously.
              </p>

              {/* Tactical Information Feature Badges */}
              <div className="w-full max-w-md grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left">
                <div className="p-2.5 rounded-xl bg-surface-container-high/50 border border-outline-variant/20 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-primary text-xs font-semibold">
                    <ShieldCheck size={14} />
                    <span>Geo-Fenced</span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-snug">
                    Alerts trigger near your saved pins or GPS.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-surface-container-high/50 border border-outline-variant/20 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-primary text-xs font-semibold">
                    <AlertTriangle size={14} />
                    <span>Thresholds</span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-snug">
                    Filtered by severity to prevent alert fatigue.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-surface-container-high/50 border border-outline-variant/20 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-primary text-xs font-semibold">
                    <MonitorSmartphone size={14} />
                    <span>Push Alerts</span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-snug">
                    Real-time popups on desktop and mobile.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!loading && notifications.length > 0 && filteredNotifications.length === 0 && (
            <div className="py-16 text-center text-on-surface-variant">
              <p className="text-sm font-medium">No alerts match the selected filter.</p>
              <button
                onClick={() => setActiveTab('all')}
                className="mt-2 text-xs text-primary hover:underline cursor-pointer"
              >
                View all notifications
              </button>
            </div>
          )}

          {!loading &&
            filteredNotifications.map((n) => {
              const level = (n.risk_level || 'LOW').toUpperCase();
              const style = SEVERITY_STYLE[level] || SEVERITY_STYLE.LOW;

              return (
                <div
                  key={n.id}
                  className={`group relative rounded-xl p-3.5 border transition-all duration-200 overflow-hidden ${
                    n.is_read
                      ? 'bg-surface-container-low/70 border-outline-variant/25 hover:border-outline-variant/40 hover:bg-surface-container/80'
                      : 'bg-surface-container-high/90 border-primary/35 shadow-sm shadow-primary/5 hover:border-primary/50'
                  }`}
                >
                  {/* Left severity gradient accent bar */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${style.bar}`} />

                  {/* Unread beacon indicator */}
                  {!n.is_read && (
                    <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5">
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                      </span>
                      <span className="text-[10px] font-bold font-label-mono-sm text-primary uppercase tracking-wider">
                        New
                      </span>
                    </div>
                  )}

                  <div className="pl-2 pr-12">
                    {/* Header line: chip + relative time */}
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border font-label-mono-sm ${style.chip}`}
                      >
                        {style.icon}
                        <span>{style.label}</span>
                      </span>

                      <div className="flex items-center gap-1 text-[11px] text-outline font-label-mono-sm">
                        <Clock size={11} />
                        <span>{formatRelativeIso(n.created_at)}</span>
                      </div>

                      {n.channel && (
                        <span className="text-[10px] text-on-surface-variant/70 uppercase font-label-mono-sm px-1.5 py-0.5 rounded bg-surface-container-highest/60 border border-outline-variant/20">
                          {n.channel}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3
                      className={`text-sm tracking-tight leading-snug ${
                        n.is_read
                          ? 'font-medium text-on-surface/85'
                          : 'font-semibold text-on-surface'
                      }`}
                    >
                      {n.title}
                    </h3>

                    {/* Body */}
                    {n.body && (
                      <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2 mt-1">
                        {n.body}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
        </div>

        {/* Modal Footer: Notification status + Settings redirect */}
        <div className="p-3 sm:p-4 bg-surface-container-low/90 border-t border-outline-variant/25 shrink-0">
          <div className="flex items-center gap-3">
            {/* Read-only popup status indicator */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                  popupDeliveryState === 'on'
                    ? 'bg-primary/15 border-primary/30 text-primary'
                    : 'bg-surface-container-highest border-outline-variant/25 text-outline'
                }`}
              >
                <MonitorSmartphone size={14} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-semibold text-on-surface-variant">
                    Device popups
                  </span>
                  {popupDeliveryState === 'on' ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold font-label-mono-sm bg-primary/20 text-primary border border-primary/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      ON
                    </span>
                  ) : popupDeliveryState === 'blocked' ? (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold font-label-mono-sm bg-error/20 text-error border border-error/30">
                      BLOCKED
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium font-label-mono-sm bg-surface-container-highest text-outline border border-outline-variant/20">
                      OFF
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-on-surface-variant/70 font-body-sm">
                  Manage notification preferences in Settings
                </p>
              </div>
            </div>

            {/* Settings redirect CTA */}
            <a
              href="/settings"
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/30 hover:border-primary/30 text-on-surface-variant hover:text-primary transition-all text-xs font-semibold shrink-0 group"
            >
              <BellRing size={13} className="shrink-0 group-hover:text-primary" />
              <span>Alert Settings</span>
              <ExternalLink size={11} className="shrink-0 opacity-60" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import {
  AlertTriangle,
  BellRing,
  CheckCheck,
  Clock,
  Flame,
  Info,
  Radio,
  ShieldCheck,
  X,
} from 'lucide-react';
import type { DisasterEvent } from '../types/disaster';

interface RecentAlertsModalProps {
  incidents: DisasterEvent[];
  onClose: () => void;
  onMarkRead: () => void;
  onSimulateAlert?: () => void;
  lastReadTime: number;
}

const SEVERITY_STYLE: Record<
  string,
  {
    bar: string;
    chip: string;
    icon: React.ReactNode;
  }
> = {
  CRITICAL: {
    bar: 'bg-gradient-to-b from-error via-red-500 to-rose-600 shadow-sm shadow-error/30',
    chip: 'bg-error/15 text-error border-error/30',
    icon: <Flame size={12} className="shrink-0" />,
  },
  HIGH: {
    bar: 'bg-gradient-to-b from-tertiary via-amber-500 to-orange-500 shadow-sm shadow-tertiary/30',
    chip: 'bg-tertiary/15 text-tertiary border-tertiary/30',
    icon: <AlertTriangle size={12} className="shrink-0" />,
  },
  MEDIUM: {
    bar: 'bg-gradient-to-b from-primary via-cyan-400 to-blue-500 shadow-sm shadow-primary/30',
    chip: 'bg-primary/15 text-primary border-primary/30',
    icon: <Info size={12} className="shrink-0" />,
  },
  LOW: {
    bar: 'bg-outline/40',
    chip: 'bg-surface-container-highest text-on-surface-variant border-outline-variant/30',
    icon: <ShieldCheck size={12} className="shrink-0" />,
  },
};

export const RecentAlertsModal: React.FC<RecentAlertsModalProps> = ({
  incidents,
  onClose,
  onMarkRead,
  lastReadTime,
}) => {
  // Sort by timestamp descending
  const sortedIncidents = [...incidents]
    .filter((inc) => new Date(inc.timestamp).getTime() > lastReadTime)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 20);

  const unreadCount = sortedIncidents.length;

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

        {/* Header */}
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
                    Recent Global Alerts
                  </h1>
                  {unreadCount > 0 ? (
                    <span className="px-2 py-0.5 text-[10px] font-bold font-label-mono-sm rounded-full bg-primary/20 text-primary border border-primary/30 animate-pulse">
                      {unreadCount} Active
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] font-medium font-label-mono-sm rounded-full bg-surface-container-highest text-outline border border-outline-variant/20">
                      All Caught Up
                    </span>
                  )}
                </div>
                <p className="text-xs text-on-surface-variant font-body-sm line-clamp-1 mt-0.5">
                  Real-time broadcast of newly detected planetary hazards
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

          {unreadCount > 0 && (
            <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-outline-variant/15">
              <span className="text-xs text-on-surface-variant font-label-mono-sm">
                Showing {unreadCount} recent unread event{unreadCount > 1 ? 's' : ''}
              </span>
              <button
                onClick={onMarkRead}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/30 text-on-surface-variant hover:text-on-surface transition-colors text-xs font-medium cursor-pointer active:scale-95"
              >
                <CheckCheck size={14} className="text-primary" />
                <span>Mark All Read</span>
              </button>
            </div>
          )}
        </div>

        {/* Alerts List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar relative z-10">
          {sortedIncidents.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-8 sm:py-12 px-4 text-center">
              {/* Tactical Radar Pulse */}
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

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-label-mono-sm font-semibold bg-primary/10 text-primary border border-primary/25 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                SECTOR SURVEILLANCE NOMINAL
              </div>

              <h2 className="text-base sm:text-lg font-bold text-on-surface tracking-tight font-headline-md mb-2">
                No New Alerts
              </h2>

              <p className="text-xs sm:text-sm text-on-surface-variant max-w-md leading-relaxed font-body-sm mb-6">
                You have reviewed all recently detected planetary incidents. New seismic, tsunami,
                and extreme weather emergencies will appear as soon as satellites detect them.
              </p>

              <div className="w-full max-w-md grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
                <div className="p-2.5 rounded-xl bg-surface-container-high/50 border border-outline-variant/20 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-primary text-xs font-semibold">
                    <ShieldCheck size={14} />
                    <span>Live Monitoring</span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-snug">
                    Real-time polling from USGS, GDACS, and NOAA.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-surface-container-high/50 border border-outline-variant/20 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-primary text-xs font-semibold">
                    <AlertTriangle size={14} />
                    <span>Early Warnings</span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-snug">
                    Telemetry is updated as emergency feeds refresh.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            sortedIncidents.map((incident) => {
              const severity = incident.severity || 'LOW';
              const style = SEVERITY_STYLE[severity] || SEVERITY_STYLE.LOW;

              return (
                <div
                  key={incident.id}
                  className="group relative rounded-xl p-3.5 border transition-all duration-200 overflow-hidden bg-surface-container-high/90 border-primary/35 shadow-sm shadow-primary/5 hover:border-primary/50"
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${style.bar}`} />

                  <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                    </span>
                  </div>

                  <div className="pl-2 pr-8">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border font-label-mono-sm ${style.chip}`}
                      >
                        {style.icon}
                        <span>{incident.type}</span>
                      </span>

                      <div className="flex items-center gap-1 text-[11px] text-outline font-label-mono-sm">
                        <Clock size={11} />
                        <span>{incident.timeAgo}</span>
                      </div>
                    </div>

                    <h3 className="text-sm font-semibold text-on-surface tracking-tight leading-snug">
                      {incident.title}
                    </h3>

                    {incident.summary && (
                      <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2 mt-1">
                        {incident.summary}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

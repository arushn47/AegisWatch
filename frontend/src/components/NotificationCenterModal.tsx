'use client';

import React, { useState } from 'react';
import { CheckCircle, MonitorSmartphone, Trash2, Zap } from 'lucide-react';
import type { NotificationRow } from '../lib/notifications';
import { formatRelativeIso } from '../lib/relativeTime';
import { usePopupAlerts } from '../lib/usePopupAlerts';

interface NotificationCenterModalProps {
  notifications: NotificationRow[];
  onClose: () => void;
  onMarkAllRead: () => void;
  onClearAll?: () => void;
  onSimulateAlert?: () => void;
  loading?: boolean;
}

const SEVERITY_BAR: Record<string, string> = {
  CRITICAL: 'bg-error',
  HIGH: 'bg-tertiary',
  MEDIUM: 'bg-primary',
  LOW: 'bg-outline',
};

const SEVERITY_CHIP: Record<string, string> = {
  CRITICAL: 'bg-error/20 text-error',
  HIGH: 'bg-tertiary/20 text-tertiary',
  MEDIUM: 'bg-primary/20 text-primary',
  LOW: 'bg-surface-container-highest text-on-surface-variant',
};

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  notifications,
  onClose,
  onMarkAllRead,
  onClearAll,
  onSimulateAlert,
  loading = false,
}) => {
  const unread = notifications.filter((n) => !n.is_read).length;

  // Popup toggle is derived from the browser's real site permission plus the
  // device opt-in flag, and re-syncs live if the user flips the browser
  // setting while this modal is open. No more toggle states that lie.
  const { state: popupState, busy: popupBusy, enable: enablePopups, disable: disablePopups } =
    usePopupAlerts();
  const [popupBusyLocal, setPopupBusyLocal] = useState(false);
  const popupToggleDisabled =
    popupState === 'blocked' || popupState === 'unsupported' || popupBusy || popupBusyLocal;

  const handlePopupToggle = async () => {
    if (popupToggleDisabled) return;
    if (popupState === 'on') {
      disablePopups();
      return;
    }
    setPopupBusyLocal(true);
    try {
      await enablePopups();
    } finally {
      setPopupBusyLocal(false);
    }
  };

  const popupsOn = popupState === 'on';
  const popupHint =
    popupState === 'on'
      ? 'On — alerts matching your preferences also raise a popup on this device.'
      : popupState === 'blocked'
        ? 'Blocked by your browser — allow notifications for this site via the lock icon in the address bar.'
        : popupState === 'needs-permission'
          ? 'Off — turning this on will ask your browser for notification permission.'
          : 'Off — alerts only appear in this list.';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-surface-container border border-outline-variant/30 rounded-xl p-panel-padding-spacious shadow-2xl relative overflow-hidden flex flex-col max-h-[80vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-outline hover:text-on-surface transition-colors z-20"
          aria-label="Close"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50 z-10"></div>

        <div className="flex items-center gap-3 mb-6 relative z-10 justify-between pr-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <span className="material-symbols-outlined text-primary text-[24px]">
                notifications_active
              </span>
            </div>
            <div>
              <h1 className="font-headline-md text-headline-md text-on-surface mt-1">
                Notification Centre
              </h1>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Alerts generated for your saved alert preferences.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onSimulateAlert && (
              <button
                onClick={onSimulateAlert}
                title="Trigger simulated crisis alert (sound, desktop popup, and incident telemetry)"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/15 hover:bg-primary/25 border border-primary/40 text-primary transition-colors text-xs font-semibold shrink-0 cursor-pointer shadow-sm"
              >
                <Zap size={14} className="fill-primary" />
                Simulate Alert
              </button>
            )}
            {unread > 0 && (
              <button
                onClick={onMarkAllRead}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant transition-colors text-xs font-medium shrink-0 cursor-pointer"
              >
                <CheckCircle size={14} />
                Mark All Read
              </button>
            )}
            {notifications.length > 0 && onClearAll && (
              <button
                onClick={onClearAll}
                title="Delete all notifications"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-error/10 hover:bg-error/20 text-error transition-colors text-xs font-medium shrink-0 cursor-pointer"
              >
                <Trash2 size={14} />
                Clear all
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar relative z-10">
          {loading && (
            <div className="p-8 text-center text-on-surface-variant">Loading alerts...</div>
          )}

          {!loading && notifications.length === 0 && (
            <div className="p-8 text-center text-on-surface-variant">
              No notifications yet. Alerts appear here when a hazard matches your saved
              preferences.
            </div>
          )}

          {!loading &&
            notifications.map((n) => {
              const level = (n.risk_level || 'LOW').toUpperCase();
              return (
                <div
                  key={n.id}
                  className={`p-3 rounded-lg border flex flex-col gap-1 relative overflow-hidden ${
                    n.is_read
                      ? 'bg-surface-container-low border-outline-variant/30'
                      : 'bg-surface-container-high border-primary/30'
                  }`}
                >
                  {!n.is_read && (
                    <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                  )}
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 ${
                      SEVERITY_BAR[level] || 'bg-primary'
                    }`}
                  ></div>

                  <div className="flex justify-between items-start pl-2 pr-4">
                    <h3
                      className={`font-medium ${
                        n.is_read ? 'text-on-surface-variant' : 'text-on-surface font-semibold'
                      }`}
                    >
                      {n.title}
                    </h3>
                  </div>

                  {n.body && (
                    <p className="text-on-surface-variant text-sm pl-2 line-clamp-2">{n.body}</p>
                  )}

                  <div className="flex items-center gap-2 pl-2 mt-1">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider ${
                        SEVERITY_CHIP[level] || SEVERITY_CHIP.LOW
                      }`}
                    >
                      {level}
                    </span>
                    <span className="text-xs text-outline">{formatRelativeIso(n.created_at)}</span>
                  </div>
                </div>
              );
            })}
        </div>

        {popupState !== 'unsupported' && (
          <div className="mt-4 pt-3 border-t border-outline-variant/30 flex items-center gap-3 shrink-0">
            <div className="p-2 rounded-lg bg-surface-container-high border border-outline-variant/30 text-on-surface-variant">
              <MonitorSmartphone size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-on-surface">Popups on this device</p>
              <p className="text-[11px] text-on-surface-variant leading-snug">{popupHint}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={popupsOn}
              aria-label="Toggle popups on this device"
              disabled={popupToggleDisabled}
              onClick={handlePopupToggle}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none cursor-pointer border ${
                popupsOn
                  ? 'bg-primary border-primary shadow-sm shadow-primary/20'
                  : 'bg-surface-container-high border-outline-variant/40 hover:border-outline'
              } ${popupToggleDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full shadow-md transition-transform duration-200 ease-in-out ${
                  popupsOn
                    ? 'translate-x-6 bg-surface-container-lowest'
                    : 'translate-x-1 bg-outline'
                }`}
              />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

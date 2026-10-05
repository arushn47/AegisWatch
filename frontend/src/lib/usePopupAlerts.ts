'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  DEVICE_ALERTS_EVENT,
  getNotificationPermission,
  getPopupDeliveryState,
  requestNotificationPermission,
  setDeviceAlertsEnabled,
  subscribeToNotificationPermission,
  subscribeToWebPush,
  type PopupDeliveryState,
} from './pwa';

export interface PopupAlertsControls {
  /** Effective state derived from browser permission + device opt-in. */
  state: PopupDeliveryState;
  /** True while the browser permission prompt is open. */
  busy: boolean;
  /**
   * Turns popups on for this device. Asks the browser for permission first
   * when it has never been answered — so the toggle can never claim "on"
   * while the browser still blocks delivery. Returns the resulting state.
   */
  enable: () => Promise<PopupDeliveryState>;
  /** Turns popups off for this device (browser permission untouched). */
  disable: () => void;
  /** Re-reads permission + flag (call after external changes). */
  refresh: () => void;
}

/**
 * One place that owns "are popups actually going to appear on this device".
 *
 * Used by the notification-centre footer toggle and the PWA widget so the two
 * can never disagree, and re-syncs automatically when the user changes the
 * browser's site permission while the page is open.
 */
export function usePopupAlerts(): PopupAlertsControls {
  const [state, setState] = useState<PopupDeliveryState>('muted');
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => {
    setState(getPopupDeliveryState());
  }, []);

  useEffect(() => {
    refresh();
    if (getPopupDeliveryState() === 'on') {
      void subscribeToWebPush();
    }
    const unsubscribe = subscribeToNotificationPermission(refresh);
    window.addEventListener(DEVICE_ALERTS_EVENT, refresh);
    window.addEventListener('storage', refresh); // other tabs
    return () => {
      unsubscribe();
      window.removeEventListener(DEVICE_ALERTS_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [refresh]);

  const enable = useCallback(async (): Promise<PopupDeliveryState> => {
    const permission = getNotificationPermission();
    if (permission === 'unsupported') return 'unsupported';
    if (permission === 'denied') return 'blocked';

    if (permission === 'default') {
      setBusy(true);
      try {
        const result = await requestNotificationPermission();
        if (result !== 'granted') {
          // Denied or dismissed — reflect reality, don't fake an "on" state.
          const next = getPopupDeliveryState();
          setState(next);
          return next;
        }
      } finally {
        setBusy(false);
      }
    }

    setDeviceAlertsEnabled(true);
    void subscribeToWebPush();
    setState('on');
    return 'on';
  }, []);

  const disable = useCallback(() => {
    setDeviceAlertsEnabled(false);
    setState(getPopupDeliveryState());
  }, []);

  return { state, busy, enable, disable, refresh };
}

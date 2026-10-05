/**
 * PWA + notification helpers.
 *
 * The dashboard previously checked `Notification.permission === 'granted'`
 * before showing an alert but never asked for permission, so no alert could
 * ever fire. These helpers are the missing request path.
 */

import { supabase, isSupabaseConfigured } from './supabase';

export type NotificationPermissionState = 'unsupported' | 'default' | 'granted' | 'denied';

let registration: ServiceWorkerRegistration | null = null;

/**
 * Device-level opt-in for OS/browser popup alerts, stored locally (per
 * browser profile + site). This is deliberately separate from
 * `Notification.permission`: permission is a persistent browser setting that
 * a user may grant once and forget, so permission alone must never be the
 * trigger for popups. Popups only fire when BOTH permission is granted AND
 * this flag is on (see showLocalNotification).
 */
const DEVICE_ALERTS_KEY = 'aegis_device_alerts_enabled';

export function areDeviceAlertsEnabled(): boolean {
  if (!isBrowser()) return false;
  try {
    const val = localStorage.getItem(DEVICE_ALERTS_KEY);
    // Explicit user setting overrides
    if (val === '0') return false;
    if (val === '1') return true;
    // If the browser already granted site notification permission and user has not explicitly opted out, default to ON!
    if (isNotificationSupported() && Notification.permission === 'granted') {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function setDeviceAlertsEnabled(enabled: boolean): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(DEVICE_ALERTS_KEY, enabled ? '1' : '0');
    // Let every listening surface (bell modal, PWA widget) re-sync.
    window.dispatchEvent(new CustomEvent(DEVICE_ALERTS_EVENT, { detail: { enabled } }));
  } catch (err) {
    console.warn('[pwa] failed to persist device alert preference:', err);
  }
}

/** Fired on window whenever the device popup opt-in changes. */
export const DEVICE_ALERTS_EVENT = 'aegis:device-alerts-changed';

/**
 * The ACTUAL popup delivery state — what the UI should present to the user.
 * This is the sync between our opt-in flag and the browser's own site
 * permission: a toggle that says "on" while the browser blocks notifications
 * would be a lie, and one that says "off" while the browser would allow them
 * hides a capability. Components should render from this, not from the raw
 * flag.
 */
export type PopupDeliveryState =
  | 'on'               // permission granted + device opt-in on
  | 'muted'            // permission granted, device opt-in off
  | 'needs-permission' // browser permission never answered — enable() must ask
  | 'blocked'          // browser denied the site; only browser settings can fix
  | 'unsupported';     // no Notification API (insecure context, old browser)

export function getPopupDeliveryState(): PopupDeliveryState {
  if (!isNotificationSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'blocked';
  if (Notification.permission !== 'granted') return 'needs-permission';
  return areDeviceAlertsEnabled() ? 'on' : 'muted';
}

/**
 * Subscribes to browser-side permission changes (user flips the site setting
 * in the address bar while our UI is open). Falls back to a no-op unsubscribe
 * where the Permissions API is unavailable (e.g. older Safari).
 */
export function subscribeToNotificationPermission(
  onChange: (permission: NotificationPermissionState) => void
): () => void {
  if (!isBrowser() || !navigator.permissions?.query) return () => {};

  let cancelled = false;
  let status: PermissionStatus | null = null;

  navigator.permissions
    .query({ name: 'notifications' as PermissionName })
    .then((s) => {
      if (cancelled) return;
      status = s;
      s.onchange = () => onChange(getNotificationPermission());
    })
    .catch(() => {
      /* Permissions API declined the query — change events just won't fire. */
    });

  return () => {
    cancelled = true;
    if (status) status.onchange = null;
  };
}

export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function isNotificationSupported(): boolean {
  return isBrowser() && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermissionState {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission as NotificationPermissionState;
}

/**
 * Registers /sw.js. Dev builds append `?env=dev` so the worker declines to
 * cache build output and can never serve a stale HMR bundle.
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isBrowser() || !('serviceWorker' in navigator)) return null;
  if (registration) return registration;

  try {
    const isDev = process.env.NODE_ENV !== 'production';
    registration = await navigator.serviceWorker.register(
      `/sw.js${isDev ? '?env=dev' : ''}`,
      { scope: '/', updateViaCache: 'none' }
    );
    return registration;
  } catch (err) {
    console.warn('[pwa] service worker registration failed:', err);
    return null;
  }
}

export function getServiceWorkerRegistration(): ServiceWorkerRegistration | null {
  return registration;
}

/**
 * Asks the user for notification permission. Must be called from a user
 * gesture — browsers ignore or auto-deny prompts fired on page load.
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    const result = await Notification.requestPermission();
    return result as NotificationPermissionState;
  } catch (err) {
    console.warn('[pwa] notification permission request failed:', err);
    return 'denied';
  }
}

/**
 * Shows a notification. Prefers the service worker (works when installed and
 * survives page backgrounding) and falls back to the constructor in dev.
 */
export async function showLocalNotification(
  title: string,
  options: NotificationOptions & { data?: { url?: string; eventId?: string | null } } = {}
): Promise<boolean> {
  // Two gates: the browser permission AND the explicit device opt-in.
  // Previously permission alone was enough, so a single "Enable alerts"
  // click (which persists in the browser forever) made every new incident
  // raise an OS popup with no way to turn it off in-app.
  if (!isNotificationSupported() || Notification.permission !== 'granted') return false;
  if (!areDeviceAlertsEnabled()) return false;

  const payload: NotificationOptions = {
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    ...options,
  };

  try {
    const reg = registration ?? (await navigator.serviceWorker?.ready);
    if (reg && 'showNotification' in reg) {
      await reg.showNotification(title, payload);
      return true;
    }
    // eslint-disable-next-line no-new
    new Notification(title, payload);
    return true;
  } catch (err) {
    console.warn('[pwa] failed to display notification:', err);
    return false;
  }
}

/** True when running as an installed app rather than a browser tab. */
export function isStandalone(): boolean {
  if (!isBrowser()) return false;
  const mql = window.matchMedia?.('(display-mode: standalone)');
  return Boolean(mql?.matches) || (navigator as any).standalone === true;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Persists a Web Push subscription for the current user and registers with the backend.
 * Enables push notification delivery to the OS even when the browser tab is closed!
 */
export async function subscribeToWebPush(userId?: string | null): Promise<PushSubscription | null> {
  if (!isBrowser() || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return null;
  }

  try {
    let vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      const res = await fetch('/api/push/vapid-key');
      const data = await res.json();
      vapidKey = data.publicKey;
    }

    if (!vapidKey) return null;

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      const convertedKey = urlBase64ToUint8Array(vapidKey);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey as unknown as BufferSource,
      });
    }

    // Register with backend push relay
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        userId: userId || null,
      }),
    });

    // Also persist directly to Supabase push_subscriptions table if authenticated
    if (userId && isSupabaseConfigured) {
      try {
        const subJSON = subscription.toJSON();
        if (subJSON.endpoint && subJSON.keys?.p256dh && subJSON.keys?.auth) {
          const { error: dbErr } = await supabase.from('push_subscriptions').upsert(
            {
              user_id: userId,
              endpoint: subJSON.endpoint,
              p256dh: subJSON.keys.p256dh,
              auth: subJSON.keys.auth,
              user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
              last_seen_at: new Date().toISOString(),
            },
            { onConflict: 'endpoint' }
          );

          if (dbErr) {
            console.warn('[pwa] Failed to write push_subscriptions to Supabase:', dbErr.message);
          } else {
            console.log('[pwa] Web Push subscription saved to Supabase push_subscriptions table');
          }
        }
      } catch (dbEx) {
        console.warn('[pwa] push_subscriptions error:', dbEx);
      }
    }

    return subscription;
  } catch (err) {
    console.warn('[pwa] Web Push subscription failed:', err);
    return null;
  }
}

/**
 * Triggers a Web Push broadcast to registered devices through the backend relay.
 */
export async function triggerBackgroundPush(payload: {
  title: string;
  body: string;
  severity?: string;
  url?: string;
  eventId?: string;
}): Promise<boolean> {
  try {
    const res = await fetch('/api/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}


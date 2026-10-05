'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bell, BellOff, Download, X, CheckCircle2, type LucideIcon } from 'lucide-react';
import { isStandalone, registerServiceWorker } from '../lib/pwa';
import { usePopupAlerts } from '../lib/usePopupAlerts';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'aegis_pwa_prompt_dismissed';

/**
 * Floating prompt offering the two things that make AegisWatch behave like a
 * real app: install it, and (for signed-in users) grant permission for browser
 * alerts. The permission request must originate from a user gesture, which is
 * exactly what this button provides.
 *
 * Popup alerts are account-gated: signed-out users only ever see the install
 * offer, since guest popups never fire (see the feed-watcher gating in
 * app/page.tsx).
 */
interface PwaStatusWidgetProps {
  authenticated?: boolean;
}

export const PwaStatusWidget: React.FC<PwaStatusWidgetProps> = ({
  authenticated = false,
}) => {
  // Popup state comes from the shared hook: derived from the browser's real
  // site permission plus the device opt-in, and re-syncs live when either
  // changes (including from the notification-centre toggle in another surface).
  const { state: popupState, busy: popupBusy, enable: enablePopups, disable: disablePopups } =
    usePopupAlerts();
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(true); // assume dismissed until we read storage
  const [installed, setInstalled] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void registerServiceWorker();

    setInstalled(isStandalone());
    setDismissed(localStorage.getItem(DISMISS_KEY) === '1');

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const handleEnableAlerts = useCallback(async () => {
    setBusy(true);
    try {
      // Granting via this button is the explicit device opt-in: the hook asks
      // the browser for permission when needed and only sets the device flag
      // when delivery can actually happen.
      await enablePopups();
    } finally {
      setBusy(false);
    }
  }, [enablePopups]);

  const handleInstall = useCallback(async () => {
    if (!installEvent) return;
    setBusy(true);
    try {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      if (choice.outcome === 'accepted') {
        setInstalled(true);
        setInstallEvent(null);
      }
    } finally {
      setBusy(false);
    }
  }, [installEvent]);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  };

  const needsPermission = popupState === 'needs-permission' && authenticated;
  const canInstall = Boolean(installEvent) && !installed;
  const isDenied = popupState === 'blocked' && authenticated;
  const popupsActive = popupState === 'on' && authenticated;
  const popupsMuted = popupState === 'muted' && authenticated;

  // The user explicitly closed the prompt — respect it regardless of the
  // permission state. (Previously a still-unanswered prompt ignored the X,
  // so the close button appeared broken.)
  if (dismissed) return null;

  // Nothing left to ask or report: permission settled, nothing to install,
  // and no popup mute/unmute control to offer.
  const needsPopupControl = (popupState === 'on' || popupState === 'muted') && authenticated;
  if (!needsPermission && !canInstall && !isDenied && !needsPopupControl) return null;

  const rows: { icon: LucideIcon; title: string; body: string; action?: React.ReactNode }[] = [];

  if (canInstall) {
    rows.push({
      icon: Download,
      title: 'Install AegisWatch',
      body: 'Run it as a standalone desktop or mobile app.',
      action: (
        <button
          type="button"
          onClick={handleInstall}
          disabled={busy}
          className="w-full bg-primary hover:bg-primary-fixed text-on-primary font-semibold py-2 px-3 rounded-lg transition-all text-sm disabled:opacity-60"
        >
          Install app
        </button>
      ),
    });
  }

  if (needsPermission) {
    rows.push({
      icon: Bell,
      title: 'Enable disaster alerts',
      body: 'Get notified the moment a relevant hazard is detected.',
      action: (
        <button
          type="button"
          onClick={handleEnableAlerts}
          disabled={busy || popupBusy}
          className="w-full bg-primary hover:bg-primary-fixed text-on-primary font-semibold py-2 px-3 rounded-lg transition-all text-sm disabled:opacity-60"
        >
          Enable alerts
        </button>
      ),
    });
  }

  if (isDenied) {
    rows.push({
      icon: BellOff,
      title: 'Alerts are blocked',
      body: 'Allow notifications for this site in your browser settings to receive alerts.',
    });
  }

  if (popupsActive || popupsMuted) {
    rows.push(
      popupsActive
        ? {
            icon: CheckCircle2,
            title: 'Alerts active',
            body: 'New hazard alerts will also pop up on this device.',
            action: (
              <button
                type="button"
                onClick={disablePopups}
                className="w-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant font-semibold py-2 px-3 rounded-lg transition-all text-sm"
              >
                Mute popups
              </button>
            ),
          }
        : {
            icon: BellOff,
            title: 'Popups muted',
            body: 'Browser permission is on, but popups are switched off here. In-app bell alerts are unaffected.',
            action: (
              <button
                type="button"
                onClick={handleEnableAlerts}
                disabled={busy || popupBusy}
                className="w-full bg-primary hover:bg-primary-fixed text-on-primary font-semibold py-2 px-3 rounded-lg transition-all text-sm disabled:opacity-60"
              >
                Turn on popups
              </button>
            ),
          }
    );
  }

  // Never render an empty card (e.g. permission granted but no install offer).
  if (rows.length === 0) return null;

  return (
    <div
      className="fixed top-20 right-4 z-[90] w-[min(20rem,calc(100vw-2rem))] max-h-[70vh] overflow-y-auto bg-surface-container border border-outline-variant/40 rounded-xl shadow-2xl"
      role="complementary"
      aria-label="App notifications and installation"
    >
      <div className="h-0.5 w-full bg-gradient-to-r from-primary via-tertiary to-transparent" />

      <div className="p-4 space-y-4">
        {rows.map(({ icon: Icon, title, body, action }) => (
          <div key={title} className="flex gap-3">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center text-primary">
              <Icon size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-on-surface">{title}</p>
              <p className="text-xs text-on-surface-variant leading-relaxed mt-0.5">{body}</p>
              {action && <div className="mt-2">{action}</div>}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleDismiss}
        title="Dismiss"
        aria-label="Dismiss"
        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
};

'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { KPIBanner } from '../components/KPIBanner';
import { FilterBar } from '../components/FilterBar';
import { IncidentList } from '../components/IncidentList';
import { IncidentDetailModal } from '../components/IncidentDetailModal';
import { NearbyAlertsModal } from '../components/NearbyAlertsModal';
import { RecentAlertsModal } from '../components/RecentAlertsModal';
import { ProfileModal } from '../components/ProfileModal';
import { AuthModal } from '../components/AuthModal';
import { PwaStatusWidget } from '../components/PwaStatusWidget';
import { NotificationCenterModal } from '../components/NotificationCenterModal';
import { EmergencyDisclaimer } from '../components/EmergencyDisclaimer';
import { createClient } from '../lib/supabase';
const supabase = createClient();
import { RelayStatusFooter } from '../components/RelayStatusFooter';
import {
  showLocalNotification,
  setDeviceAlertsEnabled,
  isNotificationSupported,
  requestNotificationPermission,
  subscribeToWebPush,
  triggerBackgroundPush,
} from '../lib/pwa';
import { playTacticalAlertSound } from '../lib/sound';
import {
  fetchNotifications,
  subscribeToNotifications,
  markAllNotificationsRead,
  clearAllNotifications,
  type NotificationRow,
} from '../lib/notifications';
import {
  fetchAllDisasters,
  computeGlobalStats,
  computeCategoryCounts,
  computeRegionCounts,
  filterByRegion,
  ingestEventsToSupabase,
} from '../services/disasterService';
import type { DisasterEvent, DisasterType, RegionFocus } from '../types/disaster';
import { RefreshCw, Zap } from 'lucide-react';

// Dynamic import with ssr: false ensures zero window/document hydration issues with Leaflet
const TacticalMap = dynamic(
  () => import('../components/TacticalMap').then((mod) => mod.TacticalMap),
  {
    ssr: false,
    loading: () => (
      <div className="relative w-full h-[480px] lg:h-[520px] rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-center shadow-xl">
        <div className="flex flex-col items-center gap-2.5 text-outline">
          <div className="w-3 h-3 rounded-full bg-primary animate-ping"></div>
          <span className="font-label-mono-sm text-xs text-primary font-medium tracking-widest uppercase">
            Synchronizing Vector Telemetry...
          </span>
        </div>
      </div>
    ),
  }
);

export default function DashboardPage() {
  const [incidents, setIncidents] = useState<DisasterEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<'all' | DisasterType>('all');
  const [regionFocus, setRegionFocus] = useState<RegionFocus>('GLOBAL');
  const [selectedIncident, setSelectedIncident] = useState<DisasterEvent | null>(null);
  const [activeView, setActiveView] = useState<'radar' | 'risk'>('radar');
  const [showRiskModal, setShowRiskModal] = useState<boolean>(false);
  const [showRecentAlerts, setShowRecentAlerts] = useState<boolean>(false);
  const [showMobileNav, setShowMobileNav] = useState<boolean>(false);
  const [lastReadTime, setLastReadTime] = useState<number>(0);
  // Tracks whether we've ever established a read baseline (stored value or a
  // freshly seeded one) so the guest badge can't count the whole feed.
  const readBaselineSetRef = useRef<boolean>(false);
  
  useEffect(() => {
    const savedTime = localStorage.getItem('aegis_last_read_time');
    if (savedTime && Number(savedTime) > 0) {
      setLastReadTime(parseInt(savedTime, 10));
      readBaselineSetRef.current = true;
    }
  }, []);
  
  
  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Middleware redirects unauthenticated visits to protected routes here
    // with ?auth=1 so we can prompt sign-in immediately.
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('auth') === '1') {
        setShowAuthModal(true);
      }
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleMarkRead = () => {
    const now = Date.now();
    setLastReadTime(now);
    localStorage.setItem('aegis_last_read_time', now.toString());
  };
  
  const unreadCount = incidents.filter(inc => new Date(inc.timestamp).getTime() > lastReadTime).length;
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [user, setUser] = useState<any | null>(null);

  // Database-backed notification centre (populated by the SQL trigger)
  const [dbNotifications, setDbNotifications] = useState<NotificationRow[]>([]);
  const [notificationsReady, setNotificationsReady] = useState<boolean>(false);
  const [notificationsLoading, setNotificationsLoading] = useState<boolean>(false);
  const [showNotificationCentre, setShowNotificationCentre] = useState<boolean>(false);

  const userId: string | null = user?.id ?? null;

  // Load existing notifications and stream new ones in over Realtime.
  useEffect(() => {
    if (!userId) {
      setDbNotifications([]);
      setNotificationsReady(false);
      return;
    }

    let cancelled = false;
    let unsubscribe: (() => void) | null = null;
    setNotificationsLoading(true);

    void (async () => {
      const rows = await fetchNotifications(supabase, userId);
      if (cancelled) return;
      setNotificationsLoading(false);

      if (rows === null) {
        // Table / RLS not in place yet — fall back to the live incident feed.
        setNotificationsReady(false);
        return;
      }

      setDbNotifications(rows);
      setNotificationsReady(true);

      unsubscribe = subscribeToNotifications(supabase, userId, (row) => {
        setDbNotifications((prev) =>
          prev.some((n) => n.id === row.id) ? prev : [row, ...prev]
        );
        void showLocalNotification(row.title, {
          body: row.body || 'A new hazard alert matched your preferences.',
          tag: row.disaster_event_id || row.id,
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
          data: { url: '/', eventId: row.disaster_event_id },
        });
      });
    })();

    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, [userId]);

  // Prefer real notification records; fall back to the live incident feed.
  const dbUnreadCount = dbNotifications.filter((n) => !n.is_read).length;
  const effectiveUnreadCount = notificationsReady ? dbUnreadCount : unreadCount;

  const handleOpenNotifications = () => {
    if (userId && notificationsReady) {
      setShowNotificationCentre(true);
    } else {
      setShowRecentAlerts(true);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    const ok = await markAllNotificationsRead(supabase, userId ?? undefined);
    if (ok) {
      const now = new Date().toISOString();
      setDbNotifications((prev) => prev.map((n) => ({ ...n, is_read: true, read_at: now })));
    }
  };

  const handleClearAllNotifications = async () => {
    if (!userId) return;
    const ok = await clearAllNotifications(supabase, userId);
    if (ok) setDbNotifications([]);
  };

  const [demoToast, setDemoToast] = useState<string | null>(null);

  const handleSimulateAlert = async () => {
    // 1. Synthesize tactical audio alert
    playTacticalAlertSound({ test: true });

    // 2. Request / trigger browser notification popup & Web Push subscription
    if (isNotificationSupported()) {
      if (Notification.permission === 'default') {
        try {
          await requestNotificationPermission();
        } catch {
          // ignore
        }
      }
      setDeviceAlertsEnabled(true);
      void subscribeToWebPush(userId);
      void showLocalNotification('🚨 DEMO ALERT: M7.4 Severe Earthquake', {
        body: 'Tactical Sensor Net: Shallow 10km depth rupture in Sunda Trench. Real-time tsunami advisory active.',
        tag: `demo-${Date.now()}`,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
      });
      // Also broadcast via Web Push protocol so OS receives it even if tab is closed
      void triggerBackgroundPush({
        title: '🚨 DEMO ALERT: M7.4 Severe Earthquake',
        body: 'Tactical Sensor Net: Shallow 10km depth rupture in Sunda Trench. Real-time tsunami advisory active.',
        severity: 'CRITICAL',
        url: '/',
        eventId: `demo-${Date.now()}`,
      });
    }

    // 3. Create simulated crisis event
    const demoId = `demo-event-${Date.now()}`;
    const demoEvent: DisasterEvent = {
      id: demoId,
      title: 'DEMO: M7.4 Severe Earthquake - Sunda Trench',
      type: 'EARTHQUAKE',
      severity: 'CRITICAL',
      status: 'ACTIVE',
      coordinates: [-0.85, 99.9],
      locationName: 'Sunda Trench, West Sumatra',
      region: 'SOUTH_ASIA',
      timestamp: new Date().toISOString(),
      timeAgo: 'Just now',
      primarySource: 'USGS Ground Telemetry (Simulation)',
      summary:
        'Critical shallow tectonic rupture detected at 10km depth. High risk of localized ground displacement and coastal wave activity. Triggered for viva/evaluator simulation.',
      metrics: {
        magnitude: 7.4,
        depthKm: 10,
        tsunamiWarning: true,
        affectedPopulation: 350000,
      },
      location: {
        type: 'Point',
        coordinates: [99.9, -0.85],
      },
      countries: ['ID'],
      isIndiaFocus: true,
      officialAdvisory:
        'CRITICAL ALERT: Ground rupture detected. Coastal zones should initiate high-ground evacuation protocols immediately.',
    };

    // Prepend to incidents list so map & feed update
    setIncidents((prev) => [demoEvent, ...prev]);

    // Select the incident so the map glides to it and telemetry panel/modal opens
    setSelectedIncident(demoEvent);

    // 4. Update notification centre / bell badge
    const demoNotification: NotificationRow = {
      id: demoId,
      user_id: userId || 'demo-user',
      disaster_event_id: demoId,
      title: '🚨 CRITICAL: M7.4 Earthquake - Sunda Trench',
      body: 'Seismic sensors detected magnitude 7.4 rupture at depth 10km. Immediate advisory dispatched.',
      risk_level: 'CRITICAL',
      channel: 'IN_APP',
      is_read: false,
      created_at: new Date().toISOString(),
      read_at: null,
    };
    setDbNotifications((prev) => [demoNotification, ...prev]);
    // Also bump guest unread count baseline so unread badge shows
    setLastReadTime((prev) => Math.min(prev, Date.now() - 1000));

    // 5. Show toast message
    setDemoToast('⚡ Demo Crisis Alert Dispatched: Audio chime, OS notification, and map telemetry active!');
    setTimeout(() => {
      setDemoToast(null);
    }, 6000);
  };

  // Load initial data and poll every 60 seconds
  const lastIngestRef = useRef<number>(0);
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const data = await fetchAllDisasters();
        if (isMounted) {
          setIncidents(data);
          setIsLoading(false);

          // First-ever visit: treat the current feed as the read baseline so the
          // bell starts empty instead of counting the entire historical feed as
          // "unread" (which produced a permanent 99+ badge for signed-out users).
          if (!readBaselineSetRef.current) {
            readBaselineSetRef.current = true;
            const baseline = Date.now();
            setLastReadTime(baseline);
            localStorage.setItem('aegis_last_read_time', baseline.toString());
          }

          // Mirror the feed into Supabase so the notification trigger can run.
          // Only pushed when a genuinely newer event appears, to keep the
          // 60-second poll from rewriting the whole table every cycle.
          const newest = data.reduce(
            (max, d) => Math.max(max, new Date(d.timestamp).getTime()),
            0
          );
          if (newest > lastIngestRef.current) {
            lastIngestRef.current = newest;
            void ingestEventsToSupabase(supabase, data);
          }
        }
      } catch (err) {
        console.error('Failed to load disaster telemetry:', err);
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 60000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);


  // Push Notification Logic (feed-watcher fallback)
  // Account-based popup gating:
  //   * Signed out — no OS popups at all; guests see the in-app feed only.
  //   * Signed in with the DB path active — stands down; the Realtime
  //     subscription already raises popups for preference-matched events, and
  //     this watcher would duplicate them while bypassing preferences.
  //   * Signed in but DB unavailable — this watcher is the only popup path,
  //     so it keeps firing (unfiltered fallback).
  const latestNotifiedTime = useRef<number>(0);

  useEffect(() => {
    if (incidents.length === 0) return;
    if (!userId || notificationsReady) return;
    
    // Find the absolute newest incident by timestamp
    const newestTime = Math.max(...incidents.map(inc => new Date(inc.timestamp).getTime()));
    
    if (latestNotifiedTime.current === 0) {
      // First load, just baseline it
      latestNotifiedTime.current = newestTime;
      return;
    }

    if (newestTime > latestNotifiedTime.current) {
      // We have new incidents!
      const newIncidents = incidents.filter(inc => new Date(inc.timestamp).getTime() > latestNotifiedTime.current);
      latestNotifiedTime.current = newestTime;
      
      const primary = newIncidents[0];
      if (primary) {
        // Prefers the service worker so alerts survive backgrounding and work
        // when the app is installed. No-ops unless permission was granted via
        // the PWA prompt (see PwaStatusWidget).
        void showLocalNotification(`AEGIS WATCH: ${primary.type} DETECTED`, {
          body: `${primary.locationName || primary.title}\nSeverity: ${primary.severity}`,
          tag: primary.id,
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
          data: { url: '/', eventId: primary.id },
        });
      }
    }
  }, [incidents, userId, notificationsReady]);


  // Filter incidents by geographic focus, then by hazard category.
  const filteredIncidents = useMemo(() => {
    const inRegion = filterByRegion(incidents, regionFocus);
    if (activeFilter === 'all') return inRegion;
    return inRegion.filter((inc) => inc.type === activeFilter);
  }, [incidents, activeFilter, regionFocus]);

  // Compute live filter counts across every hazard category
  const filterCounts = useMemo(() => computeCategoryCounts(incidents), [incidents]);
  const regionCounts = useMemo(() => computeRegionCounts(incidents), [incidents]);

  // Global sensor metrics
  const stats = useMemo(() => {
    return computeGlobalStats(incidents);
  }, [incidents]);

  const handleSelectIncident = (incident: DisasterEvent) => {
    setSelectedIncident(incident);
  };

  const handleSelectView = (view: 'radar' | 'risk') => {
    setActiveView(view);
    if (view === 'risk') {
      setShowRiskModal(true);
    }
    setShowMobileNav(false);
  };

  // Mobile drawer closes as soon as the user picks a filter / region.
  const handleSelectDomain = (domain: 'all' | DisasterType) => {
    setActiveFilter(domain);
    setShowMobileNav(false);
  };

  const handleSelectRegion = (region: RegionFocus) => {
    setRegionFocus(region);
    setShowMobileNav(false);
  };

  
  // Lock body scroll when any modal is open
  useEffect(() => {
    if (
      showMobileNav ||
      showRiskModal ||
      showRecentAlerts ||
      showProfileModal ||
      showAuthModal ||
      showNotificationCentre ||
      selectedIncident
    ) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [
    showMobileNav,
    showRiskModal,
    showRecentAlerts,
    showProfileModal,
    showAuthModal,
    showNotificationCentre,
    selectedIncident,
  ]);

  return (
    <div className="relative min-h-screen bg-surface font-body-md text-on-surface antialiased flex flex-col selection:bg-primary-container selection:text-on-primary-container">
      {/* Ambient command aurora — purely decorative, sits behind all content */}
      <div className="aegis-aurora" aria-hidden="true" />

      {/* Fixed Tactical Header */}
      <Header
        unreadCount={effectiveUnreadCount}
        onOpenNotifications={handleOpenNotifications}
        onOpenProfile={() => setShowProfileModal(true)}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenMenu={() => setShowMobileNav(true)}
        onSimulateAlert={handleSimulateAlert}
        user={user}
      />

      {/* Persistent Tactical Sidebar */}
      <Sidebar
        activeDomain={activeFilter}
        counts={filterCounts}
        onSelectDomain={handleSelectDomain}
        activeRegion={regionFocus}
        onSelectRegion={handleSelectRegion}
        regionCounts={regionCounts}
        activeView={activeView}
        onSelectView={handleSelectView}
        mobileOpen={showMobileNav}
        onClose={() => setShowMobileNav(false)}
      />

      {/* Main Content Area - matching stitch layout with pl-64 */}
      <div className="relative z-10 md:pl-64 flex-1 flex flex-col">
        <main className="relative w-full pt-20 px-4 md:px-grid-margin-desktop py-panel-padding-spacious flex flex-col gap-module-gap max-w-[1600px] mx-auto flex-1">
          {/* Top Filter Bar */}
          <FilterBar activeDomain={activeFilter} activeRegion={regionFocus} />

          {isLoading ? (
            <div className="w-full h-96 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col items-center justify-center gap-3 text-outline">
              <RefreshCw className="w-8 h-8 text-primary animate-spin" />
              <span className="font-label-mono-sm text-sm text-on-surface-variant font-medium">
                ESTABLISHING SENSOR TELEMETRY LINK...
              </span>
            </div>
          ) : (
            /* Main Split Stage Grid */

            <div className="flex flex-col gap-8 w-full">
              {/* Top Stage: Full Width Map & Metrics */}
              <div className="flex flex-col gap-4 w-full">
                {/* 1 Map Component */}
                <TacticalMap 
                  incidents={filteredIncidents} 
                  selectedIncident={selectedIncident}
                  onSelectIncident={handleSelectIncident}
                  activeRegion={regionFocus}
                />
                {/* 4 Clean Metric Summary Cards */}
                <KPIBanner stats={stats} onFilterType={setActiveFilter} />
              </div>

              {/* Bottom Stage: Incident List */}
              <div className="w-full mt-4">
                <IncidentList
                  incidents={filteredIncidents}
                  selectedIncident={selectedIncident}
                  onSelectIncident={handleSelectIncident}
                />
              </div>
            </div>
            )}

          {/* Mandatory emergency disclaimer (RULE 1.4) for this hazard view */}
          <EmergencyDisclaimer variant="bar" />

          {/* Bottom Relay Status & Ground Truth Relays */}
          <RelayStatusFooter />
        </main>
      </div>

      {/* Incident Deep Telemetry & AI Guidance Modal */}
      {selectedIncident && (
        <IncidentDetailModal
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
        />
      )}

            {/* Nearby Alerts Modal */}
      {showRiskModal && (
        <NearbyAlertsModal
          incidents={incidents}
          onClose={() => setShowRiskModal(false)}
        />
      )}

      {/* Recent Alerts (Notification Bell) Modal — live incident fallback */}
      {showRecentAlerts && (
        <RecentAlertsModal
          incidents={incidents}
          lastReadTime={lastReadTime}
          onMarkRead={handleMarkRead}
          onSimulateAlert={handleSimulateAlert}
          onClose={() => setShowRecentAlerts(false)}
        />
      )}

      {/* Database-backed notification centre */}
      {showNotificationCentre && (
        <NotificationCenterModal
          notifications={dbNotifications}
          loading={notificationsLoading}
          onMarkAllRead={handleMarkAllNotificationsRead}
          onClearAll={handleClearAllNotifications}
          onSimulateAlert={handleSimulateAlert}
          onClose={() => setShowNotificationCentre(false)}
        />
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}

      {/* User Profile Modal */}
      {showProfileModal && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfileModal(false)}
          onUserUpdated={(u) => setUser(u)}
          onSimulateAlert={handleSimulateAlert}
        />
      )}

      {/* Install prompt + browser-alert permission prompt (alerts are account-gated) */}
      <PwaStatusWidget authenticated={Boolean(user)} />

      {/* Floating Demo Alert Toast */}
      {demoToast && (
        <div className="fixed bottom-6 right-6 z-[120] max-w-md bg-surface-container-high/95 border border-primary/50 rounded-2xl p-4 shadow-2xl backdrop-blur-xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="p-2 rounded-xl bg-primary/20 text-primary shrink-0">
            <Zap className="w-5 h-5 fill-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-on-surface flex items-center gap-1.5">
              <span>Simulation Dispatched</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </h4>
            <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
              {demoToast}
            </p>
          </div>
          <button
            onClick={() => setDemoToast(null)}
            type="button"
            className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
            aria-label="Dismiss alert"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}
    </div>
  );
}

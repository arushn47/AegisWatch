'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import { createClient } from '../utils/supabase/client';
const supabase = createClient();
import { RelayStatusFooter } from '../components/RelayStatusFooter';
import { fetchAllDisasters, computeGlobalStats } from '../services/disasterService';
import type { DisasterEvent, DisasterType } from '../types/disaster';
import { RefreshCw } from 'lucide-react';

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
  const [selectedIncident, setSelectedIncident] = useState<DisasterEvent | null>(null);
  const [activeView, setActiveView] = useState<'radar' | 'risk'>('radar');
  const [showRiskModal, setShowRiskModal] = useState<boolean>(false);
  const [showRecentAlerts, setShowRecentAlerts] = useState<boolean>(false);
  const [lastReadTime, setLastReadTime] = useState<number>(0);
  
  useEffect(() => {
    const savedTime = localStorage.getItem('aegis_last_read_time');
    if (savedTime) setLastReadTime(parseInt(savedTime, 10));
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

  // Load initial data and poll every 60 seconds
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const data = await fetchAllDisasters();
        if (isMounted) {
          setIncidents(data);
          setIsLoading(false);
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


  // Push Notification Logic
  const latestNotifiedTime = useRef<number>(0);

  useEffect(() => {
    if (incidents.length === 0) return;
    
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
      
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        const primary = newIncidents[0];
        new Notification(`AEGIS WATCH: ${primary.type} DETECTED`, {
          body: `${primary.locationName || primary.title}\nSeverity: ${primary.severity}`,
          icon: '/logo.png'
        });
      }
    }
  }, [incidents]);


  // Filter incidents based on active pill
  const filteredIncidents = useMemo(() => {
    if (activeFilter === 'all') return incidents;
    return incidents.filter((inc) => inc.type === activeFilter);
  }, [incidents, activeFilter]);

  // Compute live filter counts
  const filterCounts = useMemo(() => {
    return {
      all: incidents.length,
      earthquake: incidents.filter((i) => i.type === 'EARTHQUAKE').length,
      wildfire: incidents.filter((i) => i.type === 'WILDFIRE').length,
      cyclone: incidents.filter((i) => i.type === 'CYCLONE').length,
      flood: incidents.filter((i) => i.type === 'FLOOD').length,
      tsunami: incidents.filter((i) => i.type === 'TSUNAMI').length,
      volcano: incidents.filter((i) => i.type === 'VOLCANO').length,
      landslide: incidents.filter((i) => i.type === 'LANDSLIDE').length,
      heatwave: incidents.filter((i) => i.type === 'HEATWAVE').length,
      blizzard: incidents.filter((i) => i.type === 'BLIZZARD').length,
      drought: incidents.filter((i) => i.type === 'DROUGHT').length,
    };
  }, [incidents]);

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
  };

  
  // Lock body scroll when any modal is open
  useEffect(() => {
    if (showRiskModal || showRecentAlerts || showProfileModal || showAuthModal || selectedIncident) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showRiskModal, showRecentAlerts, showProfileModal, showAuthModal, selectedIncident]);

  return (
    <div className="min-h-screen bg-surface font-body-md text-on-surface antialiased flex flex-col selection:bg-primary-container selection:text-on-primary-container">
      {/* Fixed Tactical Header */}
      <Header
        unreadCount={unreadCount}
        
        onOpenNotifications={() => setShowRecentAlerts(true)}
        onOpenProfile={() => setShowProfileModal(true)}
        onOpenAuth={() => setShowAuthModal(true)}
        user={user}
      />

      {/* Persistent Tactical Sidebar */}
      <Sidebar
        activeDomain={activeFilter}
        counts={filterCounts}
        onSelectDomain={setActiveFilter}
        activeView={activeView}
        onSelectView={handleSelectView}
      />

      {/* Main Content Area - matching stitch layout with pl-64 */}
      <div className="md:pl-64 flex-1 flex flex-col">
        <main className="relative w-full pt-20 px-grid-margin-desktop py-panel-padding-spacious flex flex-col gap-module-gap max-w-[1600px] mx-auto flex-1">
          {/* Top Filter Bar */}
          <FilterBar />

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
              <div className="flex flex-col gap-4 w-full h-[80vh] min-h-[650px]">
                {/* 1 Map Component */}
                <div className="flex-1 w-full bg-surface-container-low rounded-xl border border-outline-variant/30 overflow-hidden relative shadow-lg">
                  <TacticalMap 
                    incidents={filteredIncidents} 
                    selectedIncident={selectedIncident}
                    onSelectIncident={handleSelectIncident}
                  />
                </div>
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

      {/* Recent Alerts (Notification Bell) Modal */}
      {showRecentAlerts && (
        <RecentAlertsModal
          incidents={incidents}
          lastReadTime={lastReadTime}
          onMarkRead={handleMarkRead}
          onClose={() => setShowRecentAlerts(false)}
        />
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}

      {/* User Profile Modal */}
      {showProfileModal && (
        <ProfileModal onClose={() => setShowProfileModal(false)} />
      )}
    </div>
  );
}

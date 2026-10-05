'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import {
  fetchProfile,
  saveProfile,
  fetchGlobalPreference,
  updateDeliveryFlags,
  addSavedLocation,
} from '../lib/preferences';
import {
  areDeviceAlertsEnabled,
  setDeviceAlertsEnabled,
  isNotificationSupported,
  subscribeToWebPush,
} from '../lib/pwa';
import {
  isSilentModeEnabled,
  setSilentModeEnabled,
  playTacticalAlertSound,
} from '../lib/sound';
import {
  X,
  User,
  Bell,
  Shield,
  LogOut,
  MapPin,
  Smartphone,
  Mail,
  Globe,
  Clock,
  Volume2,
  VolumeX,
  AlertTriangle,
  CheckCircle2,
  Zap,
} from 'lucide-react';

interface ProfileModalProps {
  user?: any;
  onClose: () => void;
  onUserUpdated?: (user: any) => void;
  onSimulateAlert?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  user: propUser,
  onClose,
  onUserUpdated,
  onSimulateAlert,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'privacy'>('profile');
  const [user, setUser] = useState<any>(propUser ?? null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Form states
  const [profileData, setProfileData] = useState({
    name: 'Your Name',
    username: '',
    location: '',
    avatarUrl: '',
  });

  const [notifData, setNotifData] = useState({
    silentInApp: false,
    pushAlerts: true,
    browserNotifs: true,
    emailDigest: false,
    smsCritical: true,
  });

  const [privacyData, setPrivacyData] = useState({
    locationAccess: 'session', // 'always' | 'session' | 'never'
    shareTelemetry: true,
    dataRetention: '30days',
  });

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Load initial user and settings
  useEffect(() => {
    let isCancelled = false;

    void (async () => {
      let activeUser = propUser;
      if (!activeUser) {
        const { data } = await supabase.auth.getUser();
        activeUser = data.user;
      }
      if (isCancelled) return;
      if (activeUser) {
        setUser(activeUser);
      }

      // Initial values from OAuth / Auth user metadata
      const meta = activeUser?.user_metadata;
      const metaAvatar =
        (meta?.avatar_url as string | undefined) ||
        (meta?.picture as string | undefined) ||
        '';

      const initialName = meta?.full_name || meta?.name || 'Authorized Operator';
      const initialLocation = meta?.location || '';

      // Privacy / silent mode local storage defaults
      const storedLocationAccess =
        (typeof window !== 'undefined' ? localStorage.getItem('aegis_location_access') : null) ||
        meta?.privacyData?.locationAccess ||
        'session';

      const storedShareTelemetry =
        typeof window !== 'undefined'
          ? localStorage.getItem('aegis_share_telemetry') !== 'false'
          : true;

      const silentMode = isSilentModeEnabled();
      const deviceAlerts = areDeviceAlertsEnabled();

      setProfileData((prev) => ({
        ...prev,
        name: initialName,
        location: initialLocation,
        avatarUrl: metaAvatar || prev.avatarUrl,
      }));

      setNotifData((prev) => ({
        ...prev,
        silentInApp: silentMode,
        browserNotifs: deviceAlerts,
        pushAlerts: meta?.notifData?.pushAlerts ?? true,
        emailDigest: meta?.notifData?.emailDigest ?? false,
      }));

      setPrivacyData((prev) => ({
        ...prev,
        locationAccess: storedLocationAccess,
        shareTelemetry: storedShareTelemetry,
      }));

      // Then fetch database profile and alert preferences
      if (activeUser?.id) {
        const [profile, preference] = await Promise.all([
          fetchProfile(supabase, activeUser.id),
          fetchGlobalPreference(supabase, activeUser.id),
        ]);

        if (isCancelled) return;

        if (profile) {
          if (profile.name || profile.full_name) {
            setProfileData((prev) => ({
              ...prev,
              name: (profile.name || profile.full_name) as string,
            }));
          }
          if (profile.location) {
            setProfileData((prev) => ({
              ...prev,
              location: profile.location as string,
            }));
          }
          if (profile.avatar_url) {
            setProfileData((prev) => ({
              ...prev,
              avatarUrl: profile.avatar_url as string,
            }));
          } else if (metaAvatar) {
            setProfileData((prev) => ({ ...prev, avatarUrl: metaAvatar }));
          }
          if (profile.tracking_enabled !== undefined && profile.tracking_enabled !== null) {
            setPrivacyData((prev) => ({
              ...prev,
              locationAccess: profile.tracking_enabled ? 'always' : 'never',
            }));
          }
        }

        if (preference) {
          setNotifData((prev) => ({
            ...prev,
            pushAlerts: preference.push_enabled,
            browserNotifs: preference.in_app_enabled,
          }));
        }
      }
    })();

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      isCancelled = true;
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [propUser, onClose]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onClose();
  };

  const handleToggleBrowserNotifs = async () => {
    if (!isNotificationSupported()) {
      setFeedbackMessage('Browser notifications are not supported on this device/context.');
      setTimeout(() => setFeedbackMessage(null), 3000);
      return;
    }

    if (!notifData.browserNotifs) {
      // User is turning it ON
      if (Notification.permission === 'granted') {
        setDeviceAlertsEnabled(true);
        setNotifData((prev) => ({ ...prev, browserNotifs: true }));
      } else if (Notification.permission === 'denied') {
        setFeedbackMessage('Notifications are blocked by your browser. Please permit them in your browser site settings.');
        setTimeout(() => setFeedbackMessage(null), 4000);
      } else {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          setDeviceAlertsEnabled(true);
          setNotifData((prev) => ({ ...prev, browserNotifs: true }));
        } else {
          setDeviceAlertsEnabled(false);
          setNotifData((prev) => ({ ...prev, browserNotifs: false }));
        }
      }
    } else {
      // User is turning it OFF
      setDeviceAlertsEnabled(false);
      setNotifData((prev) => ({ ...prev, browserNotifs: false }));
    }
  };

  const handleTogglePushAlerts = async () => {
    const nextVal = !notifData.pushAlerts;
    setNotifData((prev) => ({ ...prev, pushAlerts: nextVal }));
    if (nextVal) {
      if (isNotificationSupported() && Notification.permission !== 'granted') {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          setDeviceAlertsEnabled(true);
          await subscribeToWebPush(user?.id);
          setFeedbackMessage('Background Web Push enabled (active even when AegisWatch is closed)!');
          setTimeout(() => setFeedbackMessage(null), 4000);
        } else {
          setNotifData((prev) => ({ ...prev, pushAlerts: false }));
          setFeedbackMessage('Notification permission denied by browser.');
          setTimeout(() => setFeedbackMessage(null), 3000);
        }
      } else {
        await subscribeToWebPush(user?.id);
        setFeedbackMessage('Background Web Push enabled (active even when AegisWatch is closed)!');
        setTimeout(() => setFeedbackMessage(null), 4000);
      }
    }
  };

  const handleToggleSilentMode = () => {
    const nextVal = !notifData.silentInApp;
    setNotifData((prev) => ({ ...prev, silentInApp: nextVal }));
    setSilentModeEnabled(nextVal);
    if (!nextVal) {
      // Play a quick verification chirp so user knows sound is restored
      playTacticalAlertSound({ test: true });
    }
  };

  const handleLocationAccessChange = (mode: 'always' | 'session' | 'never') => {
    setPrivacyData((prev) => ({ ...prev, locationAccess: mode }));
    if (typeof window !== 'undefined') {
      localStorage.setItem('aegis_location_access', mode);
    }
    if (mode === 'never') {
      setFeedbackMessage('GPS location services disabled for this device.');
      setTimeout(() => setFeedbackMessage(null), 2500);
    }
  };

  const handleShareTelemetryChange = () => {
    const nextVal = !privacyData.shareTelemetry;
    setPrivacyData((prev) => ({ ...prev, shareTelemetry: nextVal }));
    if (typeof window !== 'undefined') {
      localStorage.setItem('aegis_share_telemetry', nextVal ? 'true' : 'false');
    }
  };

  const handleUseLocation = () => {
    if (privacyData.locationAccess === 'never') {
      setFeedbackMessage("Location access is set to 'Block Access' in Privacy. Switch to 'While on Site' first.");
      setTimeout(() => setFeedbackMessage(null), 3000);
      return;
    }

    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setProfileData((prev) => ({
            ...prev,
            location: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
          }));
          setFeedbackMessage('Coordinates locked via device telemetry.');
          setTimeout(() => setFeedbackMessage(null), 2000);
        },
        () => {
          setFeedbackMessage('Unable to retrieve device GPS coordinates. Check browser permissions.');
          setTimeout(() => setFeedbackMessage(null), 3000);
        }
      );
    } else {
      setFeedbackMessage('Geolocation is not supported by your browser.');
      setTimeout(() => setFeedbackMessage(null), 3000);
    }
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      if (user?.id) {
        const isTracking = privacyData.locationAccess !== 'never';

        // Check if location string has lat, lng coordinates
        const coordsMatch = profileData.location.match(/(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/);
        const lat = coordsMatch ? parseFloat(coordsMatch[1]) : null;
        const lng = coordsMatch ? parseFloat(coordsMatch[2]) : null;

        const dbPromises: Promise<any>[] = [
          saveProfile(supabase, user.id, {
            name: profileData.name,
            full_name: profileData.name,
            email: user.email,
            avatar_url: profileData.avatarUrl.trim() || null,
            location: profileData.location.trim() || null,
            tracking_enabled: isTracking,
          }),
          updateDeliveryFlags(supabase, user.id, {
            in_app_enabled: notifData.browserNotifs,
            push_enabled: notifData.pushAlerts,
          }),
        ];

        // Also save to saved_locations table if coordinates were entered/locked
        if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
          dbPromises.push(
            addSavedLocation(supabase, user.id, {
              label: 'Primary Station',
              latitude: lat,
              longitude: lng,
              is_primary: true,
            })
          );
        }

        await Promise.allSettled(dbPromises);
      }

      const { data, error } = await supabase.auth.updateUser({
        data: {
          name: profileData.name,
          full_name: profileData.name,
          avatar_url: profileData.avatarUrl.trim() || null,
          picture: profileData.avatarUrl.trim() || null,
          location: profileData.location,
          notifData,
          privacyData,
        },
      });

      if (error) throw error;

      if (data?.user) {
        setUser(data.user);
        onUserUpdated?.(data.user);
      }

      setSaveStatus('saved');
      setTimeout(() => {
        setSaveStatus('idle');
        onClose();
      }, 700);
    } catch (err) {
      console.error('Save failed:', err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      if (user?.id) {
        await Promise.allSettled([
          supabase.from('saved_locations').delete().eq('user_id', user.id),
          supabase.from('alert_preferences').delete().eq('user_id', user.id),
          supabase.from('user_profiles').delete().eq('id', user.id),
        ]);
      }
      if (typeof window !== 'undefined') {
        localStorage.clear();
      }
      await supabase.auth.signOut();
      onClose();
      window.location.reload();
    } catch (err) {
      console.error('Account cleanup error:', err);
      await supabase.auth.signOut();
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  // Avatar resolution: custom URL > OAuth picture > fallback icon/initials
  const displayAvatar =
    profileData.avatarUrl ||
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    '';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 select-none">
      <div
        ref={modalRef}
        className="w-full max-w-4xl h-[82vh] min-h-[520px] max-h-[720px] bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-2xl overflow-hidden flex flex-col md:flex-row relative"
      >
        {/* Floating feedback toast */}
        {feedbackMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-surface-container-highest border border-primary/40 text-primary text-xs font-label-mono-sm rounded-full shadow-lg backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
            {feedbackMessage}
          </div>
        )}

        {/* Left Sidebar Navigation */}
        <div className="md:w-64 bg-surface-container border-b md:border-b-0 md:border-r border-outline-variant/30 flex flex-col relative shrink-0">
          <div className="p-6 border-b border-outline-variant/20 flex flex-col items-center pt-8">
            <div className="w-20 h-20 rounded-full bg-surface-container-high border-2 border-primary/50 overflow-hidden flex items-center justify-center text-primary mb-3 shadow-[0_0_15px_rgba(76,215,246,0.25)] shrink-0">
              {displayAvatar ? (
                <img
                  src={displayAvatar}
                  alt={profileData.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : user?.email ? (
                <span className="font-label-mono-sm text-xl font-bold tracking-wider text-primary">
                  {user.email.substring(0, 2).toUpperCase()}
                </span>
              ) : (
                <User className="w-8 h-8 text-on-surface-variant" />
              )}
            </div>
            <h3 className="font-headline-sm text-base font-bold text-on-surface text-center truncate w-full px-2">
              {profileData.name || 'Operator'}
            </h3>
            <p className="text-[11px] font-label-mono-sm text-outline truncate max-w-full px-2 mt-0.5">
              {user?.email || 'node.unauthenticated'}
            </p>
          </div>

          <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto custom-scrollbar">
            <button
              onClick={() => setActiveTab('profile')}
              type="button"
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all font-medium text-sm cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-primary text-on-primary shadow-md shadow-primary/20'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
            >
              <User className="w-4 h-4" /> My Profile
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              type="button"
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all font-medium text-sm cursor-pointer ${
                activeTab === 'notifications'
                  ? 'bg-primary text-on-primary shadow-md shadow-primary/20'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
            >
              <Bell className="w-4 h-4" /> Notifications
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              type="button"
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all font-medium text-sm cursor-pointer ${
                activeTab === 'privacy'
                  ? 'bg-primary text-on-primary shadow-md shadow-primary/20'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
            >
              <Shield className="w-4 h-4" /> Privacy & Telemetry
            </button>
          </nav>

          <div className="p-3 border-t border-outline-variant/20">
            <button
              onClick={handleLogout}
              type="button"
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-error hover:bg-error/10 hover:border-error/30 transition-colors font-medium text-sm border border-transparent cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col relative bg-surface-container-lowest h-full overflow-hidden">
          {/* Header */}
          <div className="h-16 border-b border-outline-variant/20 flex items-center justify-between px-6 md:px-8 bg-surface-container-lowest/80 backdrop-blur-md z-10 shrink-0">
            <h2 className="font-headline-sm text-lg md:text-xl font-bold text-on-surface flex items-center gap-2">
              {activeTab === 'profile' && (
                <>
                  <User className="w-5 h-5 text-primary" /> Profile Settings
                </>
              )}
              {activeTab === 'notifications' && (
                <>
                  <Bell className="w-5 h-5 text-primary" /> Alert & Audio Controls
                </>
              )}
              {activeTab === 'privacy' && (
                <>
                  <Shield className="w-5 h-5 text-primary" /> Privacy & Telemetry
                </>
              )}
            </h2>
            <button
              onClick={onClose}
              type="button"
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors bg-surface-container border border-outline-variant/30 cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar relative">
            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-label-mono-sm text-on-surface-variant uppercase tracking-wider">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    placeholder="Enter your name"
                    className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary outline-none transition-colors"
                  />
                </div>

                <div className="space-y-2 pt-4 border-t border-outline-variant/20">
                  <label className="text-xs font-label-mono-sm text-on-surface-variant uppercase tracking-wider">
                    Avatar URL
                  </label>
                  <div className="flex gap-3 items-start">
                    <div className="shrink-0 w-14 h-14 rounded-full bg-surface-container-high border border-outline-variant/30 overflow-hidden flex items-center justify-center">
                      {displayAvatar ? (
                        <img
                          src={displayAvatar}
                          alt="Avatar preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <User className="w-6 h-6 text-on-surface-variant" />
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="url"
                        value={profileData.avatarUrl}
                        onChange={(e) => setProfileData({ ...profileData, avatarUrl: e.target.value })}
                        placeholder="https://example.com/avatar.jpg"
                        className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary outline-none transition-colors"
                      />
                      <p className="text-[11px] text-outline mt-1.5 leading-relaxed">
                        Pre-filled from your authenticated account. Paste any image URL to customize.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-outline-variant/20">
                  <label className="text-xs font-label-mono-sm text-on-surface-variant uppercase tracking-wider">
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || 'secure.node@aegis.net'}
                    className="w-full bg-surface-container-highest border border-outline-variant/10 rounded-xl px-4 py-3 text-sm text-on-surface-variant opacity-75 cursor-not-allowed"
                  />
                  <p className="text-[11px] text-outline mt-1">Your email address is managed via your identity provider.</p>
                </div>

                <div className="space-y-2 pt-4 border-t border-outline-variant/20">
                  <label className="text-xs font-label-mono-sm text-on-surface-variant uppercase tracking-wider">
                    Your Location (Station Telemetry)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={profileData.location}
                      onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                      placeholder="City, country or lat, lng coordinates"
                      className="flex-1 bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-sm text-on-surface focus:border-primary outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={handleUseLocation}
                      className="px-4 bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 rounded-xl text-primary flex items-center justify-center transition-colors cursor-pointer"
                      title="Use my current GPS location"
                    >
                      <MapPin className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
              <div className="max-w-2xl mx-auto space-y-4">
                {/* Advanced Settings Link */}
                <Link
                  href="/settings"
                  onClick={onClose}
                  className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-primary/10 border border-primary/30 hover:border-primary/60 transition-colors group cursor-pointer"
                >
                  <div className="flex gap-3.5 items-center">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-on-surface">Detailed Filter Settings</h4>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        Customize hazard categories, severity thresholds, alert radius, and watched locations.
                      </p>
                    </div>
                  </div>
                  <span className="text-primary text-xs font-semibold shrink-0 group-hover:underline">
                    Configure &rarr;
                  </span>
                </Link>

                {/* Browser Notifications Switch */}
                <div className="bg-surface-container-low rounded-2xl border border-outline-variant/30 p-4 flex items-center justify-between hover:border-primary/30 transition-colors">
                  <div className="flex gap-3.5 items-center">
                    <div className="w-10 h-10 rounded-xl bg-surface-container border border-outline-variant/20 flex items-center justify-center text-primary shrink-0">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-on-surface text-sm">Browser Alerts & Popups</h4>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        Receive instant mission notifications on this machine.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notifData.browserNotifs}
                    onClick={handleToggleBrowserNotifs}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shrink-0 ${
                      notifData.browserNotifs ? 'bg-primary' : 'bg-surface-container-highest border border-outline-variant/30'
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 rounded-full bg-white shadow-sm transition-all absolute top-0.5 ${
                        notifData.browserNotifs ? 'left-[1.375rem]' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* Silent In-App Mode Switch */}
                <div className="bg-surface-container-low rounded-2xl border border-outline-variant/30 p-4 flex items-center justify-between hover:border-primary/30 transition-colors">
                  <div className="flex gap-3.5 items-center">
                    <div className="w-10 h-10 rounded-xl bg-surface-container border border-outline-variant/20 flex items-center justify-center text-primary shrink-0">
                      {notifData.silentInApp ? <VolumeX className="w-5 h-5 text-outline" /> : <Volume2 className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-semibold text-on-surface text-sm">Silent Mode (Audio Mute)</h4>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        Mute tactical audio synthesizers and incoming alert telemetry chimes.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notifData.silentInApp}
                    onClick={handleToggleSilentMode}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shrink-0 ${
                      notifData.silentInApp ? 'bg-primary' : 'bg-surface-container-highest border border-outline-variant/30'
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 rounded-full bg-white shadow-sm transition-all absolute top-0.5 ${
                        notifData.silentInApp ? 'left-[1.375rem]' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* Background Push Alerts */}
                <div className="bg-surface-container-low rounded-2xl border border-outline-variant/30 p-4 flex items-center justify-between hover:border-primary/30 transition-colors">
                  <div className="flex gap-3.5 items-center">
                    <div className="w-10 h-10 rounded-xl bg-surface-container border border-outline-variant/20 flex items-center justify-center text-primary shrink-0">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-on-surface text-sm">Background Push Stream</h4>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        Deliver critical disaster push notifications to registered worker devices.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notifData.pushAlerts}
                    onClick={handleTogglePushAlerts}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shrink-0 ${
                      notifData.pushAlerts ? 'bg-primary' : 'bg-surface-container-highest border border-outline-variant/30'
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 rounded-full bg-white shadow-sm transition-all absolute top-0.5 ${
                        notifData.pushAlerts ? 'left-[1.375rem]' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* Email Digest */}
                <div className="bg-surface-container-low rounded-2xl border border-outline-variant/30 p-4 flex items-center justify-between hover:border-primary/30 transition-colors">
                  <div className="flex gap-3.5 items-center">
                    <div className="w-10 h-10 rounded-xl bg-surface-container border border-outline-variant/20 flex items-center justify-center text-primary shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-on-surface text-sm">Automated Email Digest</h4>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        Daily summary of high-severity incidents in your sector.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notifData.emailDigest}
                    onClick={() => setNotifData({ ...notifData, emailDigest: !notifData.emailDigest })}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shrink-0 ${
                      notifData.emailDigest ? 'bg-primary' : 'bg-surface-container-highest border border-outline-variant/30'
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 rounded-full bg-white shadow-sm transition-all absolute top-0.5 ${
                        notifData.emailDigest ? 'left-[1.375rem]' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* Viva & Evaluation Demo Simulation */}
                {onSimulateAlert && (
                  <div className="bg-primary/5 rounded-2xl border border-primary/30 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-4">
                    <div className="flex gap-3.5 items-center">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                        <Zap className="w-5 h-5 fill-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-on-surface text-sm">Viva & Evaluation Demo Alert</h4>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          Trigger an immediate simulated crisis alert with audio telemetry, desktop notification, and live map focus.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={async () => {
                          setFeedbackMessage('⏱️ Push scheduled in 5s! You can close this tab now to test.');
                          try {
                            await fetch('/api/push/send', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                title: '🚨 CLOSED-TAB ALERT: M7.4 Earthquake',
                                body: 'Web Push Verified: Dispatched to your OS while this browser tab was closed!',
                                severity: 'CRITICAL',
                                delaySeconds: 5,
                              }),
                            });
                          } catch {
                            // ignore
                          }
                        }}
                        title="Schedules a Web Push in 5 seconds so you can close this tab and watch it appear"
                        className="px-3 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40 text-on-surface font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        Test in 5s (Close Tab)
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onSimulateAlert();
                          setFeedbackMessage('Simulated crisis alert dispatched!');
                        }}
                        className="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-primary/20"
                      >
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        Simulate Alert
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PRIVACY TAB */}
            {activeTab === 'privacy' && (
              <div className="max-w-2xl mx-auto space-y-7">
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-on-surface border-b border-outline-variant/20 pb-2">
                    Location Telemetry Permission
                  </h3>

                  <div className="bg-surface-container border border-outline-variant/30 rounded-xl p-1.5 flex flex-col sm:flex-row gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleLocationAccessChange('always')}
                      className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                        privacyData.locationAccess === 'always'
                          ? 'bg-primary/20 text-primary border border-primary/40 font-semibold'
                          : 'text-on-surface-variant hover:bg-surface-container-high border border-transparent'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" /> Always Allow
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLocationAccessChange('session')}
                      className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                        privacyData.locationAccess === 'session'
                          ? 'bg-primary/20 text-primary border border-primary/40 font-semibold'
                          : 'text-on-surface-variant hover:bg-surface-container-high border border-transparent'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" /> While on Site
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLocationAccessChange('never')}
                      className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                        privacyData.locationAccess === 'never'
                          ? 'bg-error/20 text-error border border-error/40 font-semibold'
                          : 'text-on-surface-variant hover:bg-surface-container-high border border-transparent'
                      }`}
                    >
                      <Shield className="w-3.5 h-3.5" /> Block Access
                    </button>
                  </div>
                  <p className="text-[11px] text-outline leading-relaxed mt-1.5">
                    <strong className="text-on-surface-variant">Always Allow:</strong> Permits active GPS telemetry for local alert sorting.<br />
                    <strong className="text-on-surface-variant">While on Site:</strong> Session memory only; erased when dashboard tab closes.<br />
                    <strong className="text-on-surface-variant">Block Access:</strong> Strict privacy. Disables "Locate Me" and local sensor feeds.
                  </p>
                </div>

                <div className="space-y-3 pt-4 border-t border-outline-variant/20">
                  <h3 className="font-semibold text-sm text-on-surface border-b border-outline-variant/20 pb-2">
                    Data Governance & Privacy
                  </h3>

                  <div className="flex items-center justify-between p-4 bg-surface-container rounded-xl border border-outline-variant/30">
                    <div>
                      <p className="font-medium text-sm text-on-surface">Share Anonymous Telemetry</p>
                      <p className="text-[11px] text-outline mt-0.5">
                        Contribute anonymized sensor pings to improve situational awareness models.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={privacyData.shareTelemetry}
                      onClick={handleShareTelemetryChange}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shrink-0 ${
                        privacyData.shareTelemetry ? 'bg-primary' : 'bg-surface-container-highest border border-outline-variant/30'
                      }`}
                    >
                      <span
                        className={`block w-5 h-5 rounded-full bg-white shadow-sm transition-all absolute top-0.5 ${
                          privacyData.shareTelemetry ? 'left-[1.375rem]' : 'left-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Functional Account Deletion */}
                  {showDeleteConfirm ? (
                    <div className="p-4 bg-error/15 border border-error/40 rounded-xl mt-6 space-y-3 animate-in fade-in duration-150">
                      <div className="flex items-center gap-2 text-error font-bold text-sm">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        Confirm Account Deletion
                      </div>
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        This action will immediately purge your user profile, saved locations, and notification preferences from the database. This action cannot be reversed.
                      </p>
                      <div className="flex gap-2 justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => setShowDeleteConfirm(false)}
                          disabled={isDeleting}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface-container border border-outline-variant/30 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleDeleteAccount}
                          disabled={isDeleting}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-error hover:bg-error/85 text-white transition-colors cursor-pointer shadow-sm disabled:opacity-60 flex items-center gap-1.5"
                        >
                          {isDeleting ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Purging Account...
                            </>
                          ) : (
                            'Yes, Delete My Account'
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-error/10 border border-error/20 rounded-xl mt-6 flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-error text-sm">Delete Account</h4>
                        <p className="text-[11px] text-error/80 mt-0.5">
                          Permanently delete your profile, saved locations, and preferences.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="bg-error hover:bg-error/80 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Delete Account
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-5 border-t border-outline-variant/20 bg-surface-container shrink-0 flex justify-end gap-3 z-10">
            <button
              onClick={onClose}
              type="button"
              className="px-5 py-2 rounded-xl text-sm text-on-surface-variant font-medium hover:bg-surface-container-high transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              type="button"
              disabled={saveStatus === 'saving'}
              className="px-6 py-2 rounded-xl bg-primary hover:bg-primary-fixed text-on-primary text-sm font-bold shadow-lg shadow-primary/20 transition-all flex items-center justify-center min-w-[130px] cursor-pointer disabled:opacity-60"
            >
              {saveStatus === 'saving' ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : saveStatus === 'saved' ? (
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Saved!
                </span>
              ) : saveStatus === 'error' ? (
                'Save Failed'
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

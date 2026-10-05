'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  User,
  MapPin,
  Bell,
  Plus,
  Trash2,
  Crosshair,
  Save,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronLeft,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  fetchProfile,
  saveProfile,
  fetchSavedLocations,
  addSavedLocation,
  removeSavedLocation,
  fetchGlobalPreference,
  saveGlobalPreference,
  DEFAULT_PREFERENCE,
  SUBSCRIBABLE_TYPES,
  SEVERITY_LEVELS,
  type SavedLocation,
  type AlertPreference,
} from '../lib/preferences';

type Tab = 'profile' | 'locations' | 'alerts';
type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const SEVERITY_HELP: Record<string, string> = {
  CRITICAL: 'Only the most severe events',
  HIGH: 'Significant events',
  MEDIUM: 'Moderate and above',
  LOW: 'Everything, including minor',
};

export const SettingsClient: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [schemaMissing, setSchemaMissing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('profile');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [pref, setPref] = useState({
    disaster_types: DEFAULT_PREFERENCE.disaster_types as string[],
    radius_km: DEFAULT_PREFERENCE.radius_km,
    min_severity: DEFAULT_PREFERENCE.min_severity as AlertPreference['min_severity'],
    in_app_enabled: DEFAULT_PREFERENCE.in_app_enabled,
    push_enabled: DEFAULT_PREFERENCE.push_enabled,
  });

  // Add-location form
  const [newLabel, setNewLabel] = useState('');
  const [newLat, setNewLat] = useState('');
  const [newLng, setNewLng] = useState('');
  const [locating, setLocating] = useState(false);
  const [addingLocation, setAddingLocation] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setUserId(null);
      setLoading(false);
      return;
    }

    setUserId(user.id);
    setEmail(user.email ?? null);

    const [profile, saved, preference] = await Promise.all([
      fetchProfile(supabase, user.id),
      fetchSavedLocations(supabase, user.id),
      fetchGlobalPreference(supabase, user.id),
    ]);

    // A null from both reads means the workflow tables are not in place yet.
    if (profile === null && saved === null && preference === null) {
      setSchemaMissing(true);
      setLoading(false);
      return;
    }
    setSchemaMissing(false);

    const metaName = user.user_metadata?.full_name || user.user_metadata?.name || '';
    const metaAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || '';

    setFullName(profile?.full_name || metaName || '');
    setAvatarUrl(profile?.avatar_url || metaAvatar || '');
    if (saved) setLocations(saved);
    if (preference) {
      setPref({
        disaster_types: preference.disaster_types ?? [],
        radius_km: preference.radius_km ?? DEFAULT_PREFERENCE.radius_km,
        min_severity: preference.min_severity ?? DEFAULT_PREFERENCE.min_severity,
        in_app_enabled: preference.in_app_enabled ?? true,
        push_enabled: preference.push_enabled ?? false,
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const flash = (state: SaveState) => {
    setSaveState(state);
    if (state !== 'saving') {
      setTimeout(() => setSaveState('idle'), 2200);
    }
  };

  const handleSaveProfile = async () => {
    if (!userId) return;
    flash('saving');
    const [result, authResult] = await Promise.all([
      saveProfile(supabase, userId, {
        full_name: fullName,
        avatar_url: avatarUrl || null,
      }),
      supabase.auth.updateUser({
        data: {
          full_name: fullName,
          avatar_url: avatarUrl || null,
          picture: avatarUrl || null,
        },
      }),
    ]);
    if (result.ok && !authResult.error) {
      flash('saved');
    } else {
      const err = (!result.ok ? result.message : undefined) ?? authResult.error?.message ?? 'Could not save your profile.';
      setErrorMessage(err);
      flash('error');
    }
  };

  const handleAddLocation = async () => {
    if (!userId) return;
    const lat = Number.parseFloat(newLat);
    const lng = Number.parseFloat(newLng);
    if (!newLabel.trim() || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      setErrorMessage('Give the location a name and valid latitude/longitude.');
      flash('error');
      return;
    }
    setAddingLocation(true);
    const result = await addSavedLocation(supabase, userId, {
      label: newLabel.trim(),
      latitude: lat,
      longitude: lng,
      is_primary: locations.length === 0,
    });
    setAddingLocation(false);

    if (result.ok) {
      setNewLabel('');
      setNewLat('');
      setNewLng('');
      await load();
      flash('saved');
    } else {
      setErrorMessage(result.message ?? 'Could not save that location.');
      flash('error');
    }
  };

  const handleRemoveLocation = async (id: string) => {
    const result = await removeSavedLocation(supabase, id);
    if (result.ok) {
      setLocations((prev) => prev.filter((l) => l.id !== id));
    } else {
      setErrorMessage(result.message ?? 'Could not remove that location.');
      flash('error');
    }
  };

  const handleUseMyLocation = () => {
    if (!('geolocation' in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setNewLat(pos.coords.latitude.toFixed(4));
        setNewLng(pos.coords.longitude.toFixed(4));
        setLocating(false);
      },
      () => {
        setErrorMessage('Location permission was denied or unavailable.');
        setLocating(false);
      }
    );
  };

  const handleSavePreference = async () => {
    if (!userId) return;
    flash('saving');
    const result = await saveGlobalPreference(supabase, userId, pref);
    if (result.ok) {
      flash('saved');
    } else {
      setErrorMessage(
        result.reason === 'not-configured'
          ? 'The alert tables are not available yet. Run supabase/schema.sql in your Supabase project.'
          : result.message ?? 'Could not save your alert preferences.'
      );
      flash('error');
    }
  };

  const toggleType = (type: string) => {
    setPref((prev) => ({
      ...prev,
      disaster_types: prev.disaster_types.includes(type)
        ? prev.disaster_types.filter((t) => t !== type)
        : [...prev.disaster_types, type],
    }));
  };

  const watchingEverything = pref.disaster_types.length === 0;
  const summary = useMemo(() => {
    const types = watchingEverything
      ? 'all categories'
      : `${pref.disaster_types.length} categor${pref.disaster_types.length === 1 ? 'y' : 'ies'}`;
    return `You will be alerted about ${types} at ${pref.min_severity.toLowerCase()} severity or above${
      pref.in_app_enabled ? '' : ' (in-app delivery is off)'
    }.`;
  }, [pref, watchingEverything]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex items-center gap-3 text-on-surface-variant">
          <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          Loading your preferences...
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-surface-container rounded-2xl border border-outline-variant/30 p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-tertiary mx-auto mb-4" />
          <h1 className="text-lg font-bold text-on-surface mb-2">Sign in required</h1>
          <p className="text-sm text-on-surface-variant mb-6">
            Alert preferences are tied to your account so notifications reach you even after you
            close the tab.
          </p>
          <Link
            href="/?auth=1"
            className="inline-block w-full bg-primary hover:bg-primary-fixed text-on-primary font-semibold py-3 px-4 rounded-xl transition-all"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'locations', label: 'Saved Locations', icon: MapPin },
    { id: 'alerts', label: 'Alert Preferences', icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-surface pb-20">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/20 h-16 flex items-center px-6 md:px-12 gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back to Dashboard</span>
        </Link>
        <div className="h-5 w-px bg-outline-variant/40" />
        <span className="text-sm font-semibold text-on-surface">Settings</span>
      </div>

      <div className="pt-24 px-6 md:px-12 max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight">Settings</h1>
          <p className="text-on-surface-variant mt-2">
            Choose which hazards you care about and where. These preferences drive your
            notifications.
          </p>
        </div>

        {schemaMissing && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-tertiary/10 border border-tertiary/30">
            <Info className="w-5 h-5 text-tertiary shrink-0 mt-0.5" />
            <div className="text-sm text-on-surface-variant leading-relaxed">
              <p className="font-semibold text-on-surface mb-1">Database workflow not set up yet</p>
              <p>
                Run <code className="font-mono text-xs text-primary">supabase/schema.sql</code> in
                your Supabase SQL Editor to enable saved locations and alert preferences.
              </p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-error/10 border border-error/30">
            <AlertTriangle className="w-5 h-5 text-error shrink-0 mt-0.5" />
            <p className="text-sm text-error">{errorMessage}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-outline-variant/20 overflow-x-auto custom-scrollbar">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors shrink-0 whitespace-nowrap ${
                tab === id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Profile */}
        {tab === 'profile' && (
          <section className="space-y-6">
            <div className="p-6 rounded-2xl bg-surface-container border border-outline-variant/30 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-label-mono-sm text-on-surface-variant uppercase tracking-wider">
                  Display name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:border-primary outline-none transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-label-mono-sm text-on-surface-variant uppercase tracking-wider">
                  Avatar URL
                </label>
                <div className="flex gap-3 items-start">
                  <div className="shrink-0 w-12 h-12 rounded-full bg-surface-container-low border border-outline-variant/30 overflow-hidden flex items-center justify-center">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                        onError={e => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <User className="w-5 h-5 text-on-surface-variant" />
                    )}
                  </div>
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="flex-1 bg-surface-container-low border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:border-primary outline-none transition-colors"
                  />
                </div>
                <p className="text-xs text-outline">
                  Optional. Leave blank to use the initials fallback.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-label-mono-sm text-on-surface-variant uppercase tracking-wider">
                  Email
                </label>
                <input
                  type="email"
                  disabled
                  value={email ?? ''}
                  className="w-full bg-surface-container-highest border border-outline-variant/10 rounded-xl px-4 py-3 text-on-surface-variant opacity-70 cursor-not-allowed"
                />
                <p className="text-xs text-outline">Your email address cannot be changed here.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={saveState === 'saving'}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-fixed text-on-primary font-semibold py-3 px-5 rounded-xl transition-all disabled:opacity-60"
            >
              {saveState === 'saved' ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saveState === 'saving' ? 'Saving...' : saveState === 'saved' ? 'Saved' : 'Save profile'}
            </button>
          </section>
        )}

        {/* Locations */}
        {tab === 'locations' && (
          <section className="space-y-6">
            <div className="p-6 rounded-2xl bg-surface-container border border-outline-variant/30">
              <h2 className="font-semibold text-on-surface mb-1">Watched locations</h2>
              <p className="text-sm text-on-surface-variant mb-5">
                Add the places you want to monitor. Alerts can be limited to a radius around each
                one.
              </p>

              {locations.length === 0 ? (
                <p className="text-sm text-outline py-4">No saved locations yet.</p>
              ) : (
                <ul className="space-y-3">
                  {locations.map((location) => (
                    <li
                      key={location.id}
                      className="flex items-center justify-between gap-4 p-3 rounded-xl bg-surface-container-low border border-outline-variant/30"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-on-surface truncate flex items-center gap-2">
                          {location.label}
                          {location.is_primary && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-primary/20 text-primary font-bold uppercase tracking-wider">
                              Primary
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-outline font-mono mt-0.5">
                          {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveLocation(location.id)}
                        className="p-2 rounded-lg text-outline hover:text-error hover:bg-error/10 transition-colors shrink-0"
                        title="Remove location"
                        aria-label={`Remove ${location.label}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="p-6 rounded-2xl bg-surface-container border border-outline-variant/30 space-y-4">
              <h3 className="font-semibold text-on-surface">Add a location</h3>
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Label, e.g. Home — Patna"
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:border-primary outline-none transition-colors"
              />
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  inputMode="decimal"
                  value={newLat}
                  onChange={(e) => setNewLat(e.target.value)}
                  placeholder="Latitude (e.g. 25.5941)"
                  className="flex-1 bg-surface-container-low border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:border-primary outline-none transition-colors"
                />
                <input
                  type="text"
                  inputMode="decimal"
                  value={newLng}
                  onChange={(e) => setNewLng(e.target.value)}
                  placeholder="Longitude (e.g. 85.1376)"
                  className="flex-1 bg-surface-container-low border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:border-primary outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={handleUseMyLocation}
                  disabled={locating}
                  className="px-4 py-3 rounded-xl bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/30 text-primary flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                  title="Use my current location"
                >
                  <Crosshair className="w-4 h-4" />
                  {locating ? 'Locating...' : 'Use mine'}
                </button>
              </div>
              <button
                type="button"
                onClick={handleAddLocation}
                disabled={addingLocation}
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-fixed text-on-primary font-semibold py-3 px-5 rounded-xl transition-all disabled:opacity-60"
              >
                <Plus className="w-4 h-4" />
                {addingLocation ? 'Adding...' : 'Add location'}
              </button>
            </div>
          </section>
        )}

        {/* Alert preferences */}
        {tab === 'alerts' && (
          <section className="space-y-6">
            <div className="p-6 rounded-2xl bg-surface-container border border-outline-variant/30 space-y-6">
              <div>
                <h2 className="font-semibold text-on-surface mb-1">Hazard categories</h2>
                <p className="text-sm text-on-surface-variant mb-4">
                  Leave all unselected to watch every category.
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUBSCRIBABLE_TYPES.map(({ type, label }) => {
                    const active = pref.disaster_types.includes(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => toggleType(type)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          active
                            ? 'bg-primary text-on-primary border-primary'
                            : 'bg-surface-container-low text-on-surface-variant border-outline-variant/30 hover:border-primary/40 hover:text-on-surface'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-5 border-t border-outline-variant/20">
                <h2 className="font-semibold text-on-surface mb-1">Minimum severity</h2>
                <p className="text-sm text-on-surface-variant mb-4">
                  How significant an event must be before you are notified.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SEVERITY_LEVELS.map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setPref((prev) => ({ ...prev, min_severity: level }))}
                      className={`px-3 py-2.5 rounded-xl border text-left transition-colors ${
                        pref.min_severity === level
                          ? 'border-primary bg-primary/10'
                          : 'border-outline-variant/30 bg-surface-container-low hover:border-primary/40'
                      }`}
                    >
                      <span
                        className={`block text-xs font-bold uppercase tracking-wider ${
                          pref.min_severity === level ? 'text-primary' : 'text-on-surface'
                        }`}
                      >
                        {level}
                      </span>
                      <span className="block text-[10px] text-outline mt-0.5 leading-tight">
                        {SEVERITY_HELP[level]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-5 border-t border-outline-variant/20">
                <h2 className="font-semibold text-on-surface mb-1">Alert radius</h2>
                <p className="text-sm text-on-surface-variant mb-4">
                  Distance from a saved location within which events will alert you. This only
                  applies to location-bound preferences.
                </p>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={50}
                    max={5000}
                    step={50}
                    value={pref.radius_km}
                    onChange={(e) =>
                      setPref((prev) => ({ ...prev, radius_km: Number(e.target.value) }))
                    }
                    className="flex-1 accent-[#4cd7f6]"
                  />
                  <span className="font-mono text-sm text-on-surface w-24 text-right">
                    {pref.radius_km.toLocaleString()} km
                  </span>
                </div>
              </div>

              <div className="pt-5 border-t border-outline-variant/20 space-y-3">
                <h2 className="font-semibold text-on-surface">Delivery</h2>
                {[
                  {
                    key: 'in_app_enabled' as const,
                    label: 'In-app notifications',
                    help: 'Show alerts in the notification bell and as browser alerts.',
                  },
                  {
                    key: 'push_enabled' as const,
                    label: 'Background push',
                    help: 'Deliver alerts even when AegisWatch is closed. Requires the push service to be configured.',
                  },
                ].map(({ key, label, help }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPref((prev) => ({ ...prev, [key]: !prev[key] }))}
                    className="w-full flex items-start justify-between gap-4 p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 text-left hover:border-primary/40 transition-colors"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-on-surface">{label}</span>
                      <span className="block text-xs text-outline mt-0.5 leading-relaxed">{help}</span>
                    </span>
                    <span
                      className={`mt-0.5 w-11 h-6 rounded-full shrink-0 relative transition-colors ${
                        pref[key] ? 'bg-primary' : 'bg-surface-container-highest'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-5 h-5 rounded-full bg-surface-container-lowest transition-all ${
                          pref[key] ? 'left-[1.375rem]' : 'left-0.5'
                        }`}
                      />
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <button
                type="button"
                onClick={handleSavePreference}
                disabled={saveState === 'saving'}
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-fixed text-on-primary font-semibold py-3 px-5 rounded-xl transition-all disabled:opacity-60"
              >
                {saveState === 'saved' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saveState === 'saving'
                  ? 'Saving...'
                  : saveState === 'saved'
                    ? 'Saved'
                    : 'Save alert preferences'}
              </button>
              <p className="text-xs text-on-surface-variant">{summary}</p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

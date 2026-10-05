import type { SupabaseClient } from '@supabase/supabase-js';
import type { DisasterType } from '../types/disaster';

/**
 * Data layer for the notification workflow's user-facing tables.
 *
 * Every function degrades gracefully: if the schema has not been applied yet
 * (or the visitor is signed out) reads return `null` and writes return
 * `{ ok: false, reason }` rather than throwing, so the UI can explain the
 * situation instead of crashing.
 */

export interface UserProfile {
  id: string;
  name?: string | null;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  location?: string | null;
  tracking_enabled?: boolean | null;
  role: string;
}

export interface SavedLocation {
  id: string;
  user_id: string;
  label: string;
  latitude: number;
  longitude: number;
  is_primary: boolean;
  created_at: string;
}

export interface AlertPreference {
  id: string;
  user_id: string;
  location_id: string | null;
  disaster_types: string[];
  radius_km: number;
  min_severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  in_app_enabled: boolean;
  push_enabled: boolean;
  email_enabled: boolean;
}

export type WriteResult =
  | { ok: true }
  | { ok: false; reason: 'not-configured' | 'error'; message?: string };

const NOT_CONFIGURED: WriteResult = { ok: false, reason: 'not-configured' };

/** Every hazard category the user can subscribe to. */
export const SUBSCRIBABLE_TYPES: { type: DisasterType; label: string }[] = [
  { type: 'EARTHQUAKE', label: 'Earthquakes' },
  { type: 'WILDFIRE', label: 'Wildfires' },
  { type: 'CYCLONE', label: 'Cyclones' },
  { type: 'FLOOD', label: 'Floods' },
  { type: 'TSUNAMI', label: 'Tsunamis' },
  { type: 'VOLCANO', label: 'Volcanoes' },
  { type: 'LANDSLIDE', label: 'Landslides' },
  { type: 'HEATWAVE', label: 'Heatwaves' },
  { type: 'BLIZZARD', label: 'Blizzards' },
  { type: 'DROUGHT', label: 'Droughts' },
  { type: 'TORNADO', label: 'Tornadoes' },
  { type: 'AVALANCHE', label: 'Avalanches' },
  { type: 'EPIDEMIC', label: 'Epidemics' },
];

export const SEVERITY_LEVELS = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const;

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------
export async function fetchProfile(
  client: SupabaseClient,
  userId: string
): Promise<UserProfile | null> {
  try {
    const { data, error } = await client
      .from('user_profiles')
      .select('id, email, name, full_name, avatar_url, location, tracking_enabled, role')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('[preferences] profile read skipped:', error.message);
      return null;
    }

    if (!data) {
      // The signup trigger has not created a row yet (or schema is missing).
      return {
        id: userId,
        email: null,
        name: null,
        full_name: null,
        avatar_url: null,
        location: null,
        tracking_enabled: null,
        role: 'user',
      };
    }
    return data as UserProfile;
  } catch (err) {
    console.warn('[preferences] profile read failed:', err);
    return null;
  }
}

export async function saveProfile(
  client: SupabaseClient,
  userId: string,
  patch: {
    name?: string;
    full_name?: string;
    email?: string | null;
    avatar_url?: string | null;
    location?: string | null;
    tracking_enabled?: boolean | null;
  }
): Promise<WriteResult> {
  try {
    const nameVal = patch.name || patch.full_name || 'Authorized Operator';
    const fullNameVal = patch.full_name || patch.name || 'Authorized Operator';

    const payload: Record<string, any> = {
      id: userId,
      name: nameVal,
      full_name: fullNameVal,
      updated_at: new Date().toISOString(),
    };

    if (patch.email !== undefined && patch.email !== null) payload.email = patch.email;
    if (patch.avatar_url !== undefined) payload.avatar_url = patch.avatar_url;
    if (patch.location !== undefined) payload.location = patch.location;
    if (patch.tracking_enabled !== undefined) payload.tracking_enabled = patch.tracking_enabled;

    const { error } = await client
      .from('user_profiles')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('[preferences] saveProfile error:', error.message);
      return { ok: false, reason: 'error', message: error.message };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: 'not-configured', message: String(err) };
  }
}

/**
 * Ensures the authenticated user exists in the `user_profiles` table.
 * If missing, upserts them with their email, name, avatar, and defaults.
 */
export async function ensureUserProfile(
  client: SupabaseClient,
  user: {
    id: string;
    email?: string | null;
    user_metadata?: Record<string, any>;
  }
): Promise<UserProfile | null> {
  if (!user?.id) return null;
  try {
    const meta = user.user_metadata || {};
    const nameVal = meta.full_name || meta.name || user.email?.split('@')[0] || 'Authorized Operator';
    const emailVal = user.email || `${user.id}@aegiswatch.local`;
    const avatarVal = meta.avatar_url || meta.picture || null;
    const locationVal = meta.location || null;

    const { data: existing } = await client
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (!existing) {
      const { data, error } = await client
        .from('user_profiles')
        .upsert(
          {
            id: user.id,
            name: nameVal,
            full_name: nameVal,
            email: emailVal,
            avatar_url: avatarVal,
            location: locationVal,
            tracking_enabled: true,
            role: 'user',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )
        .select()
        .maybeSingle();

      if (error) {
        console.warn('[preferences] ensureUserProfile failed:', error.message);
      }
      return (data as UserProfile) || null;
    }

    return existing as UserProfile;
  } catch (err) {
    console.warn('[preferences] ensureUserProfile error:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Saved locations
// ---------------------------------------------------------------------------
export async function fetchSavedLocations(
  client: SupabaseClient,
  userId: string
): Promise<SavedLocation[] | null> {
  try {
    const { data, error } = await client
      .from('saved_locations')
      .select('*')
      .eq('user_id', userId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('[preferences] saved locations read skipped:', error.message);
      return null;
    }
    return (data ?? []) as SavedLocation[];
  } catch (err) {
    console.warn('[preferences] saved locations read failed:', err);
    return null;
  }
}

export async function addSavedLocation(
  client: SupabaseClient,
  userId: string,
  location: { label: string; latitude: number; longitude: number; is_primary?: boolean }
): Promise<WriteResult> {
  try {
    const { error } = await client.from('saved_locations').insert({
      user_id: userId,
      label: location.label,
      latitude: location.latitude,
      longitude: location.longitude,
      is_primary: location.is_primary ?? false,
    });

    if (error) return { ok: false, reason: 'error', message: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: 'not-configured', message: String(err) };
  }
}

export async function removeSavedLocation(
  client: SupabaseClient,
  locationId: string
): Promise<WriteResult> {
  try {
    const { error } = await client.from('saved_locations').delete().eq('id', locationId);
    if (error) return { ok: false, reason: 'error', message: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: 'not-configured', message: String(err) };
  }
}

// ---------------------------------------------------------------------------
// Alert preferences
// ---------------------------------------------------------------------------
export const DEFAULT_PREFERENCE = {
  disaster_types: [] as string[],
  radius_km: 500,
  min_severity: 'HIGH' as AlertPreference['min_severity'],
  in_app_enabled: true,
  push_enabled: false,
  email_enabled: false,
};

/**
 * The global preference row (location_id IS NULL) is the one the notification
 * trigger matches first. Per-location rows are created on demand.
 */
export async function fetchGlobalPreference(
  client: SupabaseClient,
  userId: string
): Promise<AlertPreference | null> {
  try {
    const { data, error } = await client
      .from('alert_preferences')
      .select('*')
      .eq('user_id', userId)
      .is('location_id', null)
      .maybeSingle();

    if (error) {
      console.warn('[preferences] alert preference read skipped:', error.message);
      return null;
    }
    return (data as AlertPreference) ?? null;
  } catch (err) {
    console.warn('[preferences] alert preference read failed:', err);
    return null;
  }
}

/**
 * Upserts the user's global alert preference. Uses the `upsert_global_alert_preference`
 * RPC when it exists (it handles the partial unique index correctly), falling
 * back to a plain update-then-insert.
 */
export async function saveGlobalPreference(
  client: SupabaseClient,
  userId: string,
  pref: {
    disaster_types: string[];
    radius_km: number;
    min_severity: AlertPreference['min_severity'];
    in_app_enabled: boolean;
    push_enabled: boolean;
  }
): Promise<WriteResult> {
  // Preferred path: the RPC shipped in supabase/schema.sql.
  try {
    const { error } = await client.rpc('upsert_global_alert_preference', {
      p_disaster_types: pref.disaster_types,
      p_min_severity: pref.min_severity,
      p_radius_km: pref.radius_km,
      p_in_app_enabled: pref.in_app_enabled,
      p_push_enabled: pref.push_enabled,
    });
    if (!error) return { ok: true };
  } catch {
    /* fall through to the table path */
  }

  try {
    const { data: existing, error: readError } = await client
      .from('alert_preferences')
      .select('id')
      .eq('user_id', userId)
      .is('location_id', null)
      .maybeSingle();

    if (readError) {
      return { ok: false, reason: 'error', message: readError.message };
    }

    const payload = { ...pref, user_id: userId, location_id: null };

    if (existing?.id) {
      const { error } = await client
        .from('alert_preferences')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      if (error) return { ok: false, reason: 'error', message: error.message };
      return { ok: true };
    }

    const { error } = await client.from('alert_preferences').insert(payload);
    if (error) return { ok: false, reason: 'error', message: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: 'not-configured', message: String(err) };
  }
}

/**
 * Updates only the two delivery flags on the global preference row.
 *
 * Used by surfaces (like the profile modal) that expose delivery toggles but
 * not the full hazard/severity configuration — a full upsert here would
 * silently reset the user's category and severity choices.
 */
export async function updateDeliveryFlags(
  client: SupabaseClient,
  userId: string,
  flags: { in_app_enabled?: boolean; push_enabled?: boolean }
): Promise<WriteResult> {
  try {
    const { data: existing, error: readError } = await client
      .from('alert_preferences')
      .select('id')
      .eq('user_id', userId)
      .is('location_id', null)
      .maybeSingle();

    if (readError) return { ok: false, reason: 'error', message: readError.message };

    if (existing?.id) {
      const { error } = await client
        .from('alert_preferences')
        .update({ ...flags, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      if (error) return { ok: false, reason: 'error', message: error.message };
      return { ok: true };
    }

    const { error } = await client.from('alert_preferences').insert({
      user_id: userId,
      location_id: null,
      ...DEFAULT_PREFERENCE,
      ...flags,
    });
    if (error) return { ok: false, reason: 'error', message: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: 'not-configured', message: String(err) };
  }
}

/** Preferences for one saved location (used when a user has multiple places). */
export async function fetchLocationPreferences(
  client: SupabaseClient,
  userId: string
): Promise<AlertPreference[] | null> {
  try {
    const { data, error } = await client
      .from('alert_preferences')
      .select('*')
      .eq('user_id', userId)
      .not('location_id', 'is', null);

    if (error) return null;
    return (data ?? []) as AlertPreference[];
  } catch {
    return null;
  }
}

export { NOT_CONFIGURED };

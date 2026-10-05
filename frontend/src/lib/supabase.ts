'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Single canonical browser Supabase client for the whole app.
 *
 * We use `createBrowserClient` from @supabase/ssr (not the plain
 * `@supabase/supabase-js` client) so that the auth session is stored in
 * cookies that the Next.js server + middleware can read. That is what keeps
 * `supabase.auth.getUser()` and `onAuthStateChange` consistent between the
 * browser and server-rendered routes.
 *
 * `createBrowserClient` already memoizes itself in browsers; the extra
 * `globalThis` cache protects against duplicate clients across HMR re-evaluations.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

type GlobalWithSupabase = typeof globalThis & {
  __supabase_browser_singleton__?: SupabaseClient;
};

const g = globalThis as GlobalWithSupabase;

if (!g.__supabase_browser_singleton__) {
  g.__supabase_browser_singleton__ = createBrowserClient(supabaseUrl, supabaseKey);
}

/** Shared browser client instance. */
export const supabase: SupabaseClient = g.__supabase_browser_singleton__;

/**
 * Factory form kept for call sites that expect `createClient()`. Returns the
 * same shared instance so no duplicate clients are ever created.
 */
export const createClient = () => supabase;

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
// Support both key names so it works regardless of which is set in .env.local
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  ''

// Singleton: reuse the same instance during hot-module reload to prevent
// "Multiple GoTrueClient instances" warnings
const globalKey = '__supabase_singleton__'
type G = typeof globalThis & { [globalKey]?: ReturnType<typeof createClient> }
const g = globalThis as G

if (!g[globalKey]) {
  g[globalKey] = createClient(supabaseUrl, supabaseAnonKey)
}

export const supabase = g[globalKey]!

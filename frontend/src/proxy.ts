import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from './lib/supabase/middleware';

/**
 * Next.js Edge Proxy — runs on every non-static request.
 * Guards protected routes (e.g. /settings) and refreshes Supabase auth cookies.
 */
const PROTECTED_PREFIXES = ['/settings'];

export async function proxy(request: NextRequest) {
  const { supabase, supabaseResponse } = createClient(request);

  // IMPORTANT: call getUser() (not getSession()) so the session is validated
  // against Supabase Auth and refreshed cookies are written back.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtected && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/';
    redirectUrl.searchParams.set('auth', '1');
    return NextResponse.redirect(redirectUrl);
  }

  // Never drop supabaseResponse — it carries refreshed auth cookies.
  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Run on every request except Next internals and static assets so we do
     * not pay the auth round-trip for images, fonts and the service worker.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|logo.png|manifest.json|sw.js|offline.html|icons/).*)',
  ],
};

/* eslint-disable no-undef */
/**
 * AegisWatch service worker.
 *
 * Responsibilities
 *   1. Make the app installable (a registered SW + manifest is required).
 *   2. Serve a cached offline shell when the network is unavailable.
 *   3. Receive Web Push messages (the VAPID/Edge Function phase) and display
 *      them as system notifications.
 *
 * Caching policy
 *   - Navigation requests: network-first, falling back to the cached shell,
 *     then to /offline.html.
 *   - Immutable build output (/_next/static/): cache-first in production only.
 *   - Live hazard feeds and Supabase traffic: never cached. These are
 *     cross-origin (or auth-bearing) and must always hit the network.
 *
 * The registrar appends `?env=dev` in development. In dev the worker still
 * installs (so the app stays installable) but deliberately avoids caching
 * build output and HTML so it can never serve a stale HMR bundle.
 */

const VERSION = 'v1';
const CACHE_STATIC = `aegis-static-${VERSION}`;
const CACHE_PAGES = `aegis-pages-${VERSION}`;

const IS_DEV = new URL(self.location.href).searchParams.get('env') === 'dev';

// Only stable, build-independent assets are precached.
const PRECACHE_URLS = [
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/maskable-512.png',
  '/icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_STATIC);
      // addAll rejects the whole batch if any single URL fails.
      await Promise.all(
        PRECACHE_URLS.map((url) =>
          cache.add(new Request(url, { cache: 'reload' })).catch(() => undefined)
        )
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== CACHE_STATIC && key !== CACHE_PAGES)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

/** Cross-origin traffic (USGS, NASA, GDACS, ReliefWeb, Supabase) is never cached. */
function isCacheableSameOrigin(url) {
  if (url.origin !== self.location.origin) return false;
  // Never touch auth-bearing or API routes.
  if (url.pathname.startsWith('/api/')) return false;
  if (url.pathname.startsWith('/auth/')) return false;
  // Never cache the worker itself.
  if (url.pathname === '/sw.js') return false;
  return true;
}

async function handleNavigation(request) {
  const cache = await caches.open(CACHE_PAGES);
  try {
    const response = await fetch(request);
    // In production keep a copy of the shell for offline visits.
    if (!IS_DEV && response && response.ok && response.type === 'basic') {
      cache.put(request, response.clone()).catch(() => undefined);
    }
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    const offline = await caches.match('/offline.html');
    if (offline) return offline;
    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

async function handleStatic(request) {
  const cache = await caches.open(CACHE_STATIC);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok && response.type === 'basic') {
    cache.put(request, response.clone()).catch(() => undefined);
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (!isCacheableSameOrigin(url)) return; // let the browser handle it

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  // Build output is content-hashed and immutable — cache-first, production only.
  if (url.pathname.startsWith('/_next/static/')) {
    if (!IS_DEV) event.respondWith(handleStatic(request));
    return;
  }

  if (/\.(?:png|jpg|jpeg|svg|ico|webp|woff2?)$/.test(url.pathname)) {
    event.respondWith(handleStatic(request).catch(() => fetch(request)));
  }
});

// ---------------------------------------------------------------------------
// Web Push (activated once VAPID keys + the Supabase Edge Function ship)
// ---------------------------------------------------------------------------
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: 'AegisWatch Alert', body: event.data ? event.data.text() : '' };
  }

  const title = payload.title || 'AegisWatch Alert';
  const options = {
    body: payload.body || 'A new hazard event has been detected.',
    icon: payload.icon || '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: payload.tag || payload.eventId || 'aegis-alert',
    renotify: false,
    requireInteraction: payload.severity === 'CRITICAL',
    data: {
      url: payload.url || '/',
      eventId: payload.eventId || null,
      severity: payload.severity || null,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of allClients) {
        if ('focus' in client) {
          await client.focus();
          if ('navigate' in client) client.navigate(target).catch(() => undefined);
          return;
        }
      }
      if (self.clients.openWindow) await self.clients.openWindow(target);
    })()
  );
});

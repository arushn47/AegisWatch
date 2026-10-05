/** @type {import('next').NextConfig} */
const nextConfig = {
  // Type errors now fail the build (the codebase is at 0 `tsc` errors).
  // Do not re-enable `typescript.ignoreBuildErrors`.
  reactStrictMode: true,
  async headers() {
    return [
      {
        // The service worker must never be served stale, and it needs to be
        // able to control the whole origin.
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        source: '/manifest.json',
        headers: [{ key: 'Content-Type', value: 'application/manifest+json' }],
      },
    ];
  },
};

export default nextConfig;

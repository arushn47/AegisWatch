import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AegisWatch — Real-Time Global Disaster Intelligence & Situational Radar',
  description: 'Mission-critical planetary monitoring, deterministic geospatial risk detection, and AI safety guidance for global natural hazards.',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'AegisWatch — Planetary Situational Radar',
    description: 'Real-time multi-hazard telemetry, PostGIS risk detection, and emergency decision support.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Browser Tab Icon (Favicon) */}
        <link rel="icon" type="image/png" href="/logo.png" />
        <link rel="shortcut icon" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />

        {/* Google Fonts: Inter, Plus Jakarta Sans, JetBrains Mono, Material Symbols */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
        {/* Leaflet CSS */}
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body suppressHydrationWarning className="bg-surface font-body-md text-on-surface antialiased selection:bg-primary-container selection:text-on-primary-container min-h-screen">
        {children}
      </body>
    </html>
  );
}

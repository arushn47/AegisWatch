import React from 'react';
import Link from 'next/link';
import { ExternalLink, Database, Map, Satellite, Shield, Zap, Globe, Activity, ChevronLeft } from 'lucide-react';

export const metadata = {
  title: 'Resources & Data Sources | AegisWatch',
  description: 'Complete documentation of all data sources, APIs, and mapping services used by AegisWatch.',
};

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/20 h-16 flex items-center px-6 md:px-12 gap-4">
        <Link href="/" className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors group">
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to Dashboard</span>
        </Link>
        <div className="h-5 w-px bg-outline-variant/40 mx-2" />
        <span className="text-sm font-semibold text-on-surface">Resources & Data Sources</span>
      </div>

      <div className="pt-24 pb-20 px-6 md:px-12 lg:px-24 max-w-5xl mx-auto space-y-16">

        {/* Hero */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-on-surface tracking-tight">Resources & Data Sources</h1>
          <p className="text-on-surface-variant text-lg leading-relaxed max-w-2xl">
            AegisWatch pulls live data from multiple trusted public APIs and mapping services to deliver real-time global disaster intelligence. This page documents everything we use and why.
          </p>
        </div>

        {/* Live Data APIs */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-outline-variant/30 pb-4">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Database className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-on-surface">Live Disaster Data APIs</h2>
              <p className="text-sm text-on-surface-variant">Real-time feeds refreshed automatically in the background</p>
            </div>
          </div>

          <div className="space-y-4">

            {/* USGS */}
            <div className="p-6 rounded-2xl bg-surface-container border border-outline-variant/30 hover:border-primary/30 transition-colors">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#c2692a]/10 border border-[#c2692a]/30 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-[#c2692a]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-on-surface text-base">USGS Earthquake Hazards Program</h3>
                    <p className="text-xs text-on-surface-variant font-mono mt-0.5">earthquake.usgs.gov</p>
                  </div>
                </div>
                <a href="https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium">
                  View API Docs <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <p className="mt-4 text-sm text-on-surface-variant leading-relaxed">
                Provides real-time global earthquake data via GeoJSON feeds. AegisWatch fetches two feeds simultaneously:
              </p>
              <ul className="mt-3 space-y-2">
                <li className="flex items-start gap-2 text-sm text-on-surface-variant">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#c2692a] flex-shrink-0"></span>
                  <span><strong className="text-on-surface">Past 24 Hours (M2.5+)</strong> � All significant quakes globally in the last day</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-on-surface-variant">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#c2692a] flex-shrink-0"></span>
                  <span><strong className="text-on-surface">Past 7 Days (M4.5+, South Asia)</strong> � Extended window for the Indian Subcontinent & Himalayan region specifically</span>
                </li>
              </ul>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-surface-container-high border border-outline-variant/30 text-on-surface-variant">GeoJSON</span>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-surface-container-high border border-outline-variant/30 text-on-surface-variant">Public API</span>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-surface-container-high border border-outline-variant/30 text-on-surface-variant">No Auth Required</span>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-green-500/10 border border-green-500/30 text-green-400">Live Feed</span>
              </div>
            </div>

            {/* NASA EONET */}
            <div className="p-6 rounded-2xl bg-surface-container border border-outline-variant/30 hover:border-primary/30 transition-colors">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
                    <Satellite className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-on-surface text-base">NASA EONET � Earth Observatory Natural Event Tracker</h3>
                    <p className="text-xs text-on-surface-variant font-mono mt-0.5">eonet.gsfc.nasa.gov/api/v3</p>
                  </div>
                </div>
                <a href="https://eonet.gsfc.nasa.gov/docs/v3" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium">
                  View API Docs <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <p className="mt-4 text-sm text-on-surface-variant leading-relaxed">
                NASA's satellite-powered natural event tracker. AegisWatch pulls up to 300 currently-open events per refresh and maps them to our disaster types.
              </p>
              <ul className="mt-3 space-y-2">
                <li className="flex items-start gap-2 text-sm text-on-surface-variant">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#dc2626] flex-shrink-0"></span>
                  <strong className="text-on-surface">Wildfires</strong>
                </li>
                <li className="flex items-start gap-2 text-sm text-on-surface-variant">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#38bdf8] flex-shrink-0"></span>
                  <strong className="text-on-surface">Floods & Severe Storms</strong>
                </li>
                <li className="flex items-start gap-2 text-sm text-on-surface-variant">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#c084fc] flex-shrink-0"></span>
                  <strong className="text-on-surface">Tropical Cyclones & Hurricanes</strong>
                </li>
                <li className="flex items-start gap-2 text-sm text-on-surface-variant">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#FF3D00] flex-shrink-0"></span>
                  <strong className="text-on-surface">Volcanoes</strong>
                </li>
              </ul>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-surface-container-high border border-outline-variant/30 text-on-surface-variant">REST JSON</span>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-surface-container-high border border-outline-variant/30 text-on-surface-variant">Public API</span>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-surface-container-high border border-outline-variant/30 text-on-surface-variant">No Auth Required</span>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-green-500/10 border border-green-500/30 text-green-400">Live Feed</span>
              </div>
            </div>

          </div>
        </section>

        {/* Mapping */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-outline-variant/30 pb-4">
            <div className="w-9 h-9 rounded-xl bg-tertiary/10 border border-tertiary/30 flex items-center justify-center">
              <Map className="w-5 h-5 text-tertiary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-on-surface">Map & Tile Services</h2>
              <p className="text-sm text-on-surface-variant">Services that power the interactive world map</p>
            </div>
          </div>

          <div className="space-y-4">

            <div className="p-6 rounded-2xl bg-surface-container border border-outline-variant/30 hover:border-primary/30 transition-colors">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="font-bold text-on-surface text-base">Leaflet.js</h3>
                  <p className="text-xs text-on-surface-variant font-mono mt-0.5">leafletjs.com</p>
                </div>
                <a href="https://leafletjs.com" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium">
                  Visit Site <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <p className="mt-3 text-sm text-on-surface-variant leading-relaxed">
                The open-source JavaScript library that powers our interactive map. Handles all panning, zooming, marker rendering, tooltips, and fullscreen support.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-surface-container-high border border-outline-variant/30 text-on-surface-variant">Open Source</span>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-surface-container-high border border-outline-variant/30 text-on-surface-variant">BSD 2-Clause License</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-surface-container border border-outline-variant/30 hover:border-primary/30 transition-colors">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="font-bold text-on-surface text-base">Esri Dark Gray Canvas</h3>
                  <p className="text-xs text-on-surface-variant font-mono mt-0.5">server.arcgisonline.com</p>
                </div>
                <a href="https://www.esri.com/en-us/arcgis/products/arcgis-living-atlas" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium">
                  Visit Site <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <p className="mt-3 text-sm text-on-surface-variant leading-relaxed">
                The tactical dark-mode map tiles used as the base layer. This is the "Dark Gray Base" map from Esri's ArcGIS Living Atlas � a neutral dark canvas designed specifically for data visualization so that colored markers stand out clearly.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-surface-container-high border border-outline-variant/30 text-on-surface-variant">Raster Tiles</span>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-surface-container-high border border-outline-variant/30 text-on-surface-variant">� Esri & OpenStreetMap</span>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-surface-container-high border border-outline-variant/30 text-on-surface-variant">Public Access</span>
              </div>
            </div>

          </div>
        </section>

        {/* Auth & Backend */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-outline-variant/30 pb-4">
            <div className="w-9 h-9 rounded-xl bg-error/10 border border-error/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-error" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-on-surface">Authentication & Backend</h2>
              <p className="text-sm text-on-surface-variant">How user accounts and data are handled</p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-surface-container border border-outline-variant/30 hover:border-primary/30 transition-colors">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h3 className="font-bold text-on-surface text-base">Supabase</h3>
                <p className="text-xs text-on-surface-variant font-mono mt-0.5">supabase.com</p>
              </div>
              <a href="https://supabase.com/docs" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium">
                View Docs <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <p className="mt-3 text-sm text-on-surface-variant leading-relaxed">
              Handles all user sign-ups, logins, and profile data. Supports both email/password and Google (OAuth) sign-in. Your name, location preference, notification settings, and privacy choices are securely stored in Supabase.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-surface-container-high border border-outline-variant/30 text-on-surface-variant">PostgreSQL</span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-surface-container-high border border-outline-variant/30 text-on-surface-variant">OAuth 2.0</span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-green-500/10 border border-green-500/30 text-green-400">End-to-End Encrypted</span>
            </div>
          </div>
        </section>

        {/* Tech Stack */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-outline-variant/30 pb-4">
            <div className="w-9 h-9 rounded-xl bg-[#c2692a]/10 border border-[#c2692a]/30 flex items-center justify-center">
              <Zap className="w-5 h-5 text-[#c2692a]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-on-surface">Frontend Tech Stack</h2>
              <p className="text-sm text-on-surface-variant">Libraries and frameworks the website is built on</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { name: 'Next.js 15', desc: 'React framework for the web app', url: 'https://nextjs.org', tag: 'App Router' },
              { name: 'React 18', desc: 'UI component library', url: 'https://react.dev', tag: 'Hooks' },
              { name: 'Tailwind CSS', desc: 'Utility-first styling system', url: 'https://tailwindcss.com', tag: 'v4' },
              { name: 'Lucide Icons', desc: 'Clean open-source SVG icon set', url: 'https://lucide.dev', tag: 'Open Source' },
              { name: 'TypeScript', desc: 'Typed JavaScript for safer code', url: 'https://typescriptlang.org', tag: 'Strict Mode' },
              { name: 'Material Symbols', desc: 'Google icon font for UI elements', url: 'https://fonts.google.com/icons', tag: 'Outlined' },
            ].map(item => (
              <a key={item.name} href={item.url} target="_blank" rel="noreferrer"
                className="p-4 rounded-xl bg-surface-container border border-outline-variant/30 hover:border-primary/30 hover:bg-surface-container-high transition-all flex items-center gap-4 group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-on-surface">{item.name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-primary/10 border border-primary/20 text-primary">{item.tag}</span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5">{item.desc}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-outline group-hover:text-primary transition-colors flex-shrink-0" />
              </a>
            ))}
          </div>
        </section>

        {/* Privacy Note */}
        <section>
          <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-3 mb-3">
              <Globe className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-on-surface">Data Privacy</h3>
            </div>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              AegisWatch does <strong className="text-on-surface">not</strong> sell or share your personal data. All disaster data is sourced from public government and space agency APIs.
              Location access is optional � guests can grant temporary access that is erased when you close the tab. Logged-in users can configure location and notification preferences from their profile at any time.
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}


'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Plus, Minus, Maximize2, Navigation, X } from 'lucide-react';
import type { DisasterEvent } from '../types/disaster';

interface TacticalMapProps {
  incidents: DisasterEvent[];
  selectedIncident: DisasterEvent | null;
  onSelectIncident: (incident: DisasterEvent) => void;
}

export const TacticalMap: React.FC<TacticalMapProps> = ({
  incidents,
  selectedIncident,
  onSelectIncident,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [id: string]: L.Marker }>({});
  const wrapperRef = useRef<HTMLDivElement>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const [cursorCoords, setCursorCoords] = useState<{ lat: string; lng: string; zoom: number }>({
    lat: '20.0000',
    lng: '0.0000',
    zoom: 2,
  });

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [20, 10],
      zoom: 2.2,
      minZoom: 1.8,
      maxZoom: 14,
      zoomControl: false,
      attributionControl: false,
      worldCopyJump: true,
    });

    // Tactical High-Contrast Dark Basemap (Free & Public, No API key required, No watermarks)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 16,
    }).addTo(map);

    // Track mouse coordinates for the Telemetry HUD
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      setCursorCoords({
        lat: e.latlng.lat.toFixed(4),
        lng: e.latlng.lng.toFixed(4),
        zoom: Math.round(map.getZoom() * 10) / 10,
      });
    });

    map.on('zoomend', () => {
      setCursorCoords(prev => ({
        ...prev,
        zoom: Math.round(map.getZoom() * 10) / 10,
      }));
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Render Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach((marker) => {
      marker.remove();
    });
    markersRef.current = {};

    incidents.forEach((incident) => {
      if (incident.coordinates && incident.coordinates.length === 2) {
        const [lat, lng] = incident.coordinates;

        // Visual Classification Engine
        let colorClass = '#8b949e';
        let ringColorClass = 'rgba(139, 148, 158, 0.3)';
        let badgeLabel = 'Event';

        if (incident.type === 'WILDFIRE') {
          colorClass = '#dc2626'; // red
          ringColorClass = 'rgba(220, 38, 38, 0.35)';
          badgeLabel = incident.metrics.acresBurned ? `${(incident.metrics.acresBurned / 1000).toFixed(1)}k ac` : 'Wildfire';
        } else if (incident.type === 'EARTHQUAKE') {
          colorClass = '#c2692a'; // brown
          ringColorClass = 'rgba(139, 69, 19, 0.35)';
          badgeLabel = incident.metrics.magnitude ? `M ${incident.metrics.magnitude.toFixed(1)}` : 'Quake';
        } else if (incident.type === 'CYCLONE') {
          colorClass = '#c084fc';
          ringColorClass = 'rgba(192, 132, 252, 0.35)';
          badgeLabel = incident.metrics.windSpeedKmh ? `${incident.metrics.windSpeedKmh} km/h` : 'Cyclone';
        } else if (incident.type === 'FLOOD') {
          colorClass = '#38bdf8';
          ringColorClass = 'rgba(56, 189, 248, 0.35)';
          badgeLabel = incident.metrics.crestHeightM ? `+${incident.metrics.crestHeightM}m` : 'Flood';
        }

        const markerHtml = `
          <div class="relative flex items-center justify-center w-6 h-6 group">
            <span class="absolute w-full h-full rounded-full animate-ping" style="background-color: ${ringColorClass}; animation-duration: 2s;"></span>
            <span class="relative w-3 h-3 rounded-full border-2 border-surface-container shadow-[0_0_8px_rgba(0,0,0,0.8)]" style="background-color: ${colorClass};"></span>
          </div>
        `;

        const icon = L.divIcon({
          className: 'tactical-marker',
          html: markerHtml,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker([lat, lng], { icon }).addTo(map);

        const latStr = lat >= 0 ? `${lat.toFixed(4)}&deg;N` : `${Math.abs(lat).toFixed(4)}&deg;S`;
        const lngStr = lng >= 0 ? `${lng.toFixed(4)}&deg;E` : `${Math.abs(lng).toFixed(4)}&deg;W`;

        // Build location string � skip parts that duplicate the title
        const locationParts = [incident.locationName, incident.region]
          .filter(Boolean)
          .filter(part => !incident.title || !part.startsWith(incident.title));
        const locationLine = locationParts.join(', ');

        const tooltipContent = `
          <div style="background: rgba(13, 17, 23, 0.95); border: 1px solid rgba(48, 54, 61, 0.8); border-radius: 6px; padding: 6px 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); backdrop-filter: blur(4px);">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
              <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background-color: ${colorClass};"></span>
              <strong style="color: #e6edf3; font-family: ui-sans-serif, system-ui, sans-serif; font-size: 11px; letter-spacing: 0.05em; text-transform: uppercase;">${incident.type}</strong>
              <span style="color: ${colorClass}; font-family: monospace; font-size: 10px; font-weight: 700; margin-left: 4px;">${badgeLabel}</span>
            </div>
            ${incident.title ? '<div style="color: #e6edf3; font-size: 11px; font-weight: 600; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">' + incident.title + '</div>' : ''}
            ${locationLine ? '<div style="color: #8b949e; font-size: 10px; margin-top: 2px; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">' + locationLine + '</div>' : ''}
            <div style="font-family: monospace; font-size: 9px; color: #6e7681; margin-top: 3px;">
              [${latStr}, ${lngStr}]
            </div>
          </div>
        `;
        marker.bindTooltip(tooltipContent, {
          direction: 'top',
          offset: [0, -12],
          opacity: 0.96,
          className: 'tactical-map-tooltip',
        });

        marker.on('click', () => {
          onSelectIncident(incident);
        });

        markersRef.current[incident.id] = marker;
      }
    });
  }, [incidents, selectedIncident, onSelectIncident]);

  // Pan to selected incident when selection changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedIncident) return;

    const [lat, lng] = selectedIncident.coordinates;
    map.flyTo([lat, lng], Math.max(map.getZoom(), 5.5), {
      duration: 1.2,
    });
  }, [selectedIncident]);

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      wrapperRef.current?.requestFullscreen().catch(err => {
        console.error('Error attempting to enable fullscreen:', err.message);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const placeUserMarker = (latitude: number, longitude: number, flyTo: boolean = false) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    
    if (flyTo) {
      map.flyTo([latitude, longitude], 7, { duration: 1.5 });
    }
    
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([latitude, longitude]);
    } else {
      const markerHtml = `
        <div style="position: relative; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 36px; height: 36px; background-color: rgba(255, 0, 0, 0.4); border-radius: 50%; animation: pulse 2s infinite;"></div>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ff0000" stroke="#ffffff" stroke-width="1.5" style="width: 40px; height: 40px; position: relative; z-index: 10; filter: drop-shadow(0px 4px 4px rgba(0,0,0,0.6));">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
      `;
      
      const userIcon = L.divIcon({
        className: '',
        html: markerHtml,
        iconSize: [48, 48],
        iconAnchor: [24, 48],
      });
      
      userMarkerRef.current = L.marker([latitude, longitude], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
      userMarkerRef.current.bindTooltip('YOUR LOCATION', {
        direction: 'top',
        offset: [0, -12],
        className: 'font-label-mono-sm text-xs font-bold'
      });
    }
  };

  useEffect(() => {
    if (!navigator.geolocation) return;

    const tryAutoLocate = () => {
      const hasConsent = sessionStorage.getItem('guest_location_consent');
      const isProbablyLoggedIn = document.cookie.includes('sb-') || !!localStorage.getItem('supabase.auth.token');

      // Use the Permissions API to check silently � no browser popup shown
      if (navigator.permissions) {
        navigator.permissions.query({ name: 'geolocation' }).then((result) => {
          // 'granted' = they already said yes before, place pin immediately
          if (result.state === 'granted') {
            navigator.geolocation.getCurrentPosition((position) => {
              placeUserMarker(position.coords.latitude, position.coords.longitude, false);
            }, () => {});
          } else if (result.state === 'prompt' && (isProbablyLoggedIn || hasConsent)) {
            // They're logged in / gave consent, ask once
            navigator.geolocation.getCurrentPosition((position) => {
              placeUserMarker(position.coords.latitude, position.coords.longitude, false);
            }, () => {});
          }
          // 'denied' � do nothing, respect their choice
        });
      } else if (isProbablyLoggedIn || hasConsent) {
        // Fallback for browsers without Permissions API
        navigator.geolocation.getCurrentPosition((position) => {
          placeUserMarker(position.coords.latitude, position.coords.longitude, false);
        }, () => {});
      }
    };

    // Small delay to ensure the Leaflet map has fully initialised before placing a marker
    const timer = setTimeout(tryAutoLocate, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    
    const hasConsent = sessionStorage.getItem('guest_location_consent');
    const isProbablyLoggedIn = document.cookie.includes('sb-') || localStorage.getItem('supabase.auth.token');
    
    if (!isProbablyLoggedIn && !hasConsent) {
      const consent = window.confirm(
        "Privacy Notice: You are browsing as a guest.\n\nTo show your location on the map, we need temporary access to your GPS. Your location data will NOT be saved to any server, and it will be completely erased from memory the moment you close this website.\n\nDo you want to allow temporary access?"
      );
      if (!consent) return;
      sessionStorage.setItem('guest_location_consent', 'true');
    }

    navigator.geolocation.getCurrentPosition((position) => {
      placeUserMarker(position.coords.latitude, position.coords.longitude, true);
    });
  };

  return (
    <div ref={wrapperRef} className="relative w-full h-[480px] lg:h-[520px] bg-surface-container-lowest rounded-xl bg-surface-container-lowest border border-outline-variant/30 overflow-hidden shadow-2xl">
      {/* Actual Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Fullscreen Exit Button */}
      {isFullscreen && (
        <button
          onClick={() => document.exitFullscreen()}
          className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-surface-container-high/90 backdrop-blur-md border border-outline-variant/40 hover:bg-error hover:text-white hover:border-error text-on-surface flex items-center justify-center shadow-2xl transition-all"
          title="Exit Fullscreen"
          type="button"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Top-Left Coverage Badge */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-low/90 backdrop-blur-md border border-outline-variant/40 shadow-sm pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
        <span className="font-label-mono-sm text-xs text-on-surface-variant font-medium tracking-wide">
          Live Coverage &bull; {incidents.length} Active Incidents Detected
        </span>
      </div>

      {/* Bottom-Left Coordinate & Zoom HUD */}
      <div className="absolute bottom-3 left-3 z-20 hidden sm:flex items-center gap-3 px-3 py-1 rounded-lg bg-surface-container-low/85 backdrop-blur-md border border-outline-variant/30 text-outline font-label-mono-sm text-[11px] tabular-nums pointer-events-none">
        <span>LAT: <span className="text-on-surface">{cursorCoords.lat}&deg;</span></span>
        <span>LNG: <span className="text-on-surface">{cursorCoords.lng}&deg;</span></span>
        <span>ZOOM: <span className="text-primary">{cursorCoords.zoom}x</span></span>
      </div>

      {/* Bottom-Right Tactical Navigation Controls */}
      <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1">
        <button
          onClick={handleLocateMe}
          className="w-8 h-8 rounded-lg bg-surface-container-low/90 backdrop-blur-md hover:bg-surface-container border border-outline-variant/40 text-primary flex items-center justify-center shadow-md transition-colors"
          title="Locate Me"
          type="button"
        >
          <Navigation className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomIn}
          className="w-8 h-8 rounded-lg bg-surface-container-low/90 backdrop-blur-md hover:bg-surface-container border border-outline-variant/40 text-on-surface flex items-center justify-center shadow-md transition-colors"
          title="Zoom In"
          type="button"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-8 h-8 rounded-lg bg-surface-container-low/90 backdrop-blur-md hover:bg-surface-container border border-outline-variant/40 text-on-surface flex items-center justify-center shadow-md transition-colors"
          title="Zoom Out"
          type="button"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={handleFullscreen}
          className="w-8 h-8 rounded-lg bg-surface-container-low/90 backdrop-blur-md hover:bg-surface-container border border-outline-variant/40 text-on-surface flex items-center justify-center shadow-md transition-colors"
          title="Toggle Fullscreen"
          type="button"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

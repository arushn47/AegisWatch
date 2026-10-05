'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { Plus, Minus, Maximize2, Navigation, X } from 'lucide-react';
import type { DisasterEvent, RegionFocus } from '../types/disaster';
import { REGION_THEATERS } from '../types/disaster';
import { normalizeLatitude, normalizeLongitude } from '../lib/geo';
import { getEventMarkerStyle } from '../lib/hazardClassification';
import { MapLegend } from './MapLegend';

interface TacticalMapProps {
  incidents: DisasterEvent[];
  selectedIncident: DisasterEvent | null;
  onSelectIncident: (incident: DisasterEvent) => void;
  activeRegion?: RegionFocus;
}

export const TacticalMap: React.FC<TacticalMapProps> = ({
  incidents,
  selectedIncident,
  onSelectIncident,
  activeRegion,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [id: string]: L.Marker }>({});
  const wrapperRef = useRef<HTMLDivElement>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  const [cursorCoords, setCursorCoords] = useState<{ lat: string; lng: string; zoom: number }>({
    lat: '20.0000',
    lng: '10.0000',
    zoom: 2.2,
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

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [20, 10],
      zoom: 2.2,
      minZoom: 1.8,
      maxZoom: 14,
      zoomControl: false,
      attributionControl: false,
      // Vertical lock: keep the viewport inside the Mercator world (approx ±85°)
      maxBounds: [[-85, -1080], [85, 1080]],
      maxBoundsViscosity: 1.0,
      worldCopyJump: true,
    });

    // Tactical High-Contrast Dark Basemap
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 16,
      }
    ).addTo(map);

    // Track mouse coordinates with normalized latitude and longitude
    const updateCoordinates = (lat: number, lng: number) => {
      const normLat = normalizeLatitude(lat);
      const normLng = normalizeLongitude(lng);
      setCursorCoords({
        lat: normLat.toFixed(4),
        lng: normLng.toFixed(4),
        zoom: Math.round(map.getZoom() * 10) / 10,
      });
    };

    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      updateCoordinates(e.latlng.lat, e.latlng.lng);
    });

    map.on('zoomend', () => {
      setCursorCoords((prev) => ({
        ...prev,
        zoom: Math.round(map.getZoom() * 10) / 10,
      }));
    });

    map.on('moveend', () => {
      const center = map.getCenter();
      updateCoordinates(center.lat, center.lng);
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
        const [rawLat, rawLng] = incident.coordinates;
        const normLat = normalizeLatitude(rawLat);
        const normLng = normalizeLongitude(rawLng);

        // Visual Classification Engine using shared helper
        const { color, badgeLabel, coreSize, pulse } = getEventMarkerStyle(incident);
        const isSelected = selectedIncident?.id === incident.id;

        const markerHtml = `
          <div style="position:relative;width:24px;height:24px;display:flex;align-items:center;justify-content:center;">
            ${pulse ? `<span class="aegis-sonar-ring" style="width:${coreSize + 8}px;height:${coreSize + 8}px;color:${color};"></span>` : ''}
            <span style="position:relative;width:${coreSize}px;height:${coreSize}px;border-radius:9999px;background-color:${color};box-shadow:${isSelected ? '0 0 0 2px #ffffff, 0 0 0 4px #090d16, 0 2px 5px rgba(0,0,0,0.8)' : '0 1px 3px rgba(0,0,0,0.7), 0 0 0 1.5px #090d16'};"></span>
          </div>
        `;

        const icon = L.divIcon({
          className: 'aegis-marker-wrap',
          html: markerHtml,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker([normLat, normLng], {
          icon,
          zIndexOffset: isSelected ? 1000 : 0,
        }).addTo(map);

        const latStr = normLat >= 0 ? `${normLat.toFixed(4)}&deg;N` : `${Math.abs(normLat).toFixed(4)}&deg;S`;
        const lngStr = normLng >= 0 ? `${normLng.toFixed(4)}&deg;E` : `${Math.abs(normLng).toFixed(4)}&deg;W`;

        // Build location string — skip parts that duplicate the title
        const locationParts = [incident.locationName, incident.region]
          .filter(Boolean)
          .filter((part) => !incident.title || !part.startsWith(incident.title));
        const locationLine = locationParts.join(', ');

        const tooltipContent = `
          <div style="background: rgba(13, 17, 23, 0.95); border: 1px solid rgba(48, 54, 61, 0.8); border-radius: 6px; padding: 6px 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); backdrop-filter: blur(4px);">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
              <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background-color: ${color};"></span>
              <strong style="color: #e6edf3; font-family: ui-sans-serif, system-ui, sans-serif; font-size: 11px; letter-spacing: 0.05em; text-transform: uppercase;">${incident.type}</strong>
              <span style="color: ${color}; font-family: monospace; font-size: 10px; font-weight: 700; margin-left: 4px;">${badgeLabel}</span>
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
          offset: [0, -14],
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
    map.flyTo([normalizeLatitude(lat), normalizeLongitude(lng)], Math.max(map.getZoom(), 5.5), {
      duration: 1.2,
    });
  }, [selectedIncident]);

  // Pan & Zoom to selected regional theater
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !activeRegion) return;
    const theater = REGION_THEATERS.find((t) => t.id === activeRegion);
    if (theater) {
      map.flyTo(theater.center, theater.zoom, { duration: 1.4 });
    }
  }, [activeRegion]);

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      wrapperRef.current?.requestFullscreen().catch((err) => {
        console.error('Error attempting to enable fullscreen:', err.message);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const placeUserMarker = (latitude: number, longitude: number, flyTo: boolean = false) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const normLat = normalizeLatitude(latitude);
    const normLng = normalizeLongitude(longitude);

    if (flyTo) {
      map.flyTo([normLat, normLng], 7, { duration: 1.5 });
    }

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([normLat, normLng]);
    } else {
      const markerHtml = `
        <div style="position:relative;width:28px;height:38px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;">
          <div class="aegis-pin-radar"></div>
          <svg width="24" height="32" viewBox="0 0 24 32" fill="none" style="filter: drop-shadow(0 2px 5px rgba(0,0,0,0.75)); position:relative; z-index:2;" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 1C6.477 1 2 5.477 2 11C2 17.5 10.5 28.5 11.4 29.7C11.7 30.1 12.3 30.1 12.6 29.7C13.5 28.5 22 17.5 22 11C22 5.477 17.523 1 12 1Z" fill="#4cd7f6" stroke="#090d16" stroke-width="1.75" stroke-linejoin="round"/>
            <circle cx="12" cy="11" r="4.5" fill="#090d16"/>
            <circle cx="12" cy="11" r="2" fill="#4cd7f6"/>
          </svg>
        </div>
      `;

      const userIcon = L.divIcon({
        className: 'aegis-marker-wrap',
        html: markerHtml,
        iconSize: [28, 38],
        iconAnchor: [14, 36],
      });

      userMarkerRef.current = L.marker([normLat, normLng], {
        icon: userIcon,
        zIndexOffset: 1000,
      }).addTo(map);

      userMarkerRef.current.bindTooltip('YOUR LOCATION', {
        direction: 'top',
        offset: [0, -32],
        className: 'font-label-mono-sm text-xs font-bold',
      });
    }
  };

  useEffect(() => {
    if (!navigator.geolocation || (typeof window !== 'undefined' && localStorage.getItem('aegis_location_access') === 'never')) return;

    const tryAutoLocate = () => {
      const hasConsent = sessionStorage.getItem('guest_location_consent');
      const isProbablyLoggedIn =
        document.cookie.includes('sb-') || !!localStorage.getItem('supabase.auth.token');

      if (navigator.permissions) {
        navigator.permissions.query({ name: 'geolocation' }).then((result) => {
          if (result.state === 'granted') {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                placeUserMarker(position.coords.latitude, position.coords.longitude, false);
              },
              () => {}
            );
          } else if (result.state === 'prompt' && (isProbablyLoggedIn || hasConsent)) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                placeUserMarker(position.coords.latitude, position.coords.longitude, false);
              },
              () => {}
            );
          }
        });
      } else if (isProbablyLoggedIn || hasConsent) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            placeUserMarker(position.coords.latitude, position.coords.longitude, false);
          },
          () => {}
        );
      }
    };

    const timer = setTimeout(tryAutoLocate, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    if (typeof window !== 'undefined' && localStorage.getItem('aegis_location_access') === 'never') {
      alert("Location access is set to 'Block Access' in AegisWatch Privacy Settings. Switch to 'While on Site' or 'Always Allow' in Profile Settings to use Locate Me.");
      return;
    }

    const hasConsent = sessionStorage.getItem('guest_location_consent');
    const isProbablyLoggedIn =
      document.cookie.includes('sb-') || localStorage.getItem('supabase.auth.token');

    if (!isProbablyLoggedIn && !hasConsent) {
      const consent = window.confirm(
        'Privacy Notice: You are browsing as a guest.\n\nTo show your location on the map, we need temporary access to your GPS. Your location data will NOT be saved to any server, and it will be completely erased from memory the moment you close this website.\n\nDo you want to allow temporary access?'
      );
      if (!consent) return;
      sessionStorage.setItem('guest_location_consent', 'true');
    }

    navigator.geolocation.getCurrentPosition((position) => {
      placeUserMarker(position.coords.latitude, position.coords.longitude, true);
    });
  };

  // High risk event count for operational summary
  const highRiskCount = useMemo(() => {
    return incidents.filter((i) => i.severity === 'CRITICAL' || i.severity === 'HIGH').length;
  }, [incidents]);

  return (
    <div
      ref={wrapperRef}
      className="relative w-full h-[460px] sm:h-[500px] lg:h-[540px] bg-surface-container-lowest rounded-xl border border-outline-variant/30 overflow-hidden shadow-2xl"
    >
      {/* Actual Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Fullscreen Exit Button - Centered top banner */}
      {isFullscreen && (
        <button
          onClick={() => document.exitFullscreen()}
          className="absolute top-3 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 rounded-full bg-surface-container-high/90 backdrop-blur-md border border-outline-variant/40 hover:bg-red-500/20 hover:border-red-500/40 text-on-surface hover:text-red-400 flex items-center gap-1.5 shadow-2xl transition-all text-xs font-label-mono-sm uppercase cursor-pointer"
          title="Exit Fullscreen (Esc)"
          type="button"
        >
          <X className="w-3.5 h-3.5" />
          <span>Exit Fullscreen</span>
        </button>
      )}

      {/* Top Map Operational Header: Live Coverage Badge + Tactical Legend */}
      <div className="absolute top-2.5 sm:top-3 inset-x-2.5 sm:inset-x-3 z-30 flex items-center justify-between gap-2 pointer-events-none">
        {/* Coverage Badge */}
        <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-surface-container-low/95 backdrop-blur-md border border-outline-variant/40 shadow-sm pointer-events-auto min-w-0 max-w-[calc(100%-110px)] sm:max-w-none">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
          <span className="font-label-mono-sm text-[11px] sm:text-xs text-on-surface-variant font-medium tracking-wide truncate flex items-center gap-1">
            <span className="hidden md:inline">Live Coverage &bull;</span>
            <span className="text-on-surface font-semibold tabular-nums">{incidents.length}</span>
            <span className="hidden sm:inline">Active Events</span>
            <span className="sm:hidden">Events</span>
            {highRiskCount > 0 && (
              <>
                <span className="text-outline mx-0.5">&bull;</span>
                <span className="text-amber-400 font-semibold tabular-nums">{highRiskCount}</span>
                <span className="text-amber-400/90 font-medium hidden xs:inline sm:inline">High Risk</span>
                <span className="text-amber-400/90 font-medium xs:hidden sm:hidden">Risk</span>
              </>
            )}
          </span>
        </div>

        {/* Tactical Legend */}
        <MapLegend incidents={incidents} />
      </div>

      {/* Bottom-Left Coordinate & Zoom HUD with normalized coordinates */}
      <div className="absolute bottom-3 left-3 z-20 hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-surface-container-low/85 backdrop-blur-md border border-outline-variant/30 text-outline font-label-mono-sm text-[11px] tabular-nums pointer-events-none shadow-md">
        <span>
          LAT: <span className="text-on-surface font-medium">{cursorCoords.lat}&deg;</span>
        </span>
        <span>
          LNG: <span className="text-on-surface font-medium">{cursorCoords.lng}&deg;</span>
        </span>
        <span>
          ZOOM: <span className="text-primary font-semibold">{cursorCoords.zoom}x</span>
        </span>
      </div>

      {/* Bottom-Right Tactical Navigation Controls */}
      <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1 bg-surface-container-low/85 backdrop-blur-md p-1 rounded-xl border border-outline-variant/35 shadow-lg">
        <button
          onClick={handleLocateMe}
          className="w-8 h-8 rounded-lg hover:bg-surface-container-high text-primary flex items-center justify-center transition-colors focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none"
          title="Locate My Position"
          aria-label="Locate My Position"
          type="button"
        >
          <Navigation className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-4 bg-outline-variant/20 mx-0.5" />
        <button
          onClick={handleZoomIn}
          className="w-8 h-8 rounded-lg hover:bg-surface-container-high text-on-surface hover:text-primary flex items-center justify-center transition-colors focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none"
          title="Zoom In"
          aria-label="Zoom In"
          type="button"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-8 h-8 rounded-lg hover:bg-surface-container-high text-on-surface hover:text-primary flex items-center justify-center transition-colors focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none"
          title="Zoom Out"
          aria-label="Zoom Out"
          type="button"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-4 bg-outline-variant/20 mx-0.5" />
        <button
          onClick={handleFullscreen}
          className="w-8 h-8 rounded-lg hover:bg-surface-container-high text-on-surface hover:text-primary flex items-center justify-center transition-colors focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none"
          title={isFullscreen ? 'Exit Fullscreen' : 'Toggle Fullscreen'}
          aria-label={isFullscreen ? 'Exit Fullscreen' : 'Toggle Fullscreen'}
          type="button"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

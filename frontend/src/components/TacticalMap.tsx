'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Plus, Minus, Maximize2 } from 'lucide-react';
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
  const [cursorCoords, setCursorCoords] = useState<{ lat: string; lng: string; zoom: number }>({
    lat: '20.0000',
    lng: '0.0000',
    zoom: 2,
  });

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [20, 10],
      zoom: 2.2,
      minZoom: 1.8,
      maxZoom: 14,
      zoomControl: false,
      attributionControl: true,
      worldCopyJump: true,
    });

    // Tactical High-Contrast Dark Basemap (Free & Public, No API key required, No watermarks)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; Esri &bull; OpenStreetMap',
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

  // Sync Markers with Incidents
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove obsolete markers
    Object.keys(markersRef.current).forEach(id => {
      if (!incidents.find(inc => inc.id === id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    // Add or update markers
    incidents.forEach(incident => {
      const [lat, lng] = incident.coordinates;
      const isSelected = selectedIncident?.id === incident.id;

      // Determine color styling based on hazard domain and severity
      let colorClass = '#4cd7f6'; // default cyan
      let ringColorClass = 'rgba(76, 215, 246, 0.4)';
      let badgeLabel: string = incident.type;

      if (incident.type === 'EARTHQUAKE') {
        colorClass = '#ffb95f'; // tertiary amber
        ringColorClass = 'rgba(255, 185, 95, 0.35)';
        badgeLabel = `M ${incident.metrics.magnitude?.toFixed(1) || 'Quake'}`;
      } else if (incident.type === 'WILDFIRE') {
        colorClass = '#ef4444'; // critical crimson
        ringColorClass = 'rgba(239, 68, 68, 0.4)';
        badgeLabel = 'Wildfire';
      } else if (incident.type === 'CYCLONE') {
        colorClass = '#06b6d4'; // primary cyan
        ringColorClass = 'rgba(6, 182, 212, 0.4)';
        badgeLabel = incident.metrics.windSpeedKmh ? `${incident.metrics.windSpeedKmh} km/h` : 'Cyclone';
      } else if (incident.type === 'FLOOD') {
        colorClass = '#38bdf8'; // sky blue
        ringColorClass = 'rgba(56, 189, 248, 0.35)';
        badgeLabel = incident.metrics.crestHeightM ? `+${incident.metrics.crestHeightM}m` : 'Flood';
      }

      const markerHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group/marker" style="width: 36px; height: 36px;">
          <span class="absolute w-8 h-8 rounded-full radar-beacon-ping" style="background-color: ${ringColorClass};"></span>
          <span class="relative w-4 h-4 rounded-full shadow-lg flex items-center justify-center border-2 border-surface ${
            isSelected ? 'ring-2 ring-primary ring-offset-1 ring-offset-surface scale-125' : ''
          }" style="background-color: ${colorClass};">
            ${isSelected ? '<span class="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>' : ''}
          </span>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'tactical-radar-marker',
        html: markerHtml,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      if (markersRef.current[incident.id]) {
        markersRef.current[incident.id].setIcon(customIcon);
        markersRef.current[incident.id].setLatLng([lat, lng]);
      } else {
        const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);

        // Hover tooltip styled in mission-control aesthetic
        const tooltipContent = `
          <div style="background: #181c24; border: 1px solid #374151; padding: 6px 10px; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.6); color: #dfe2ee; font-family: 'Inter', sans-serif;">
            <div style="font-weight: 600; font-size: 11px; margin-bottom: 2px;">${incident.title}</div>
            <div style="font-family: 'JetBrains Mono', monospace; font-size: 10px; color: ${colorClass}; font-weight: 600;">
              ${badgeLabel} &bull; ${incident.region}
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

  const handleResetProjection = () => {
    mapInstanceRef.current?.flyTo([20, 10], 2.2, { duration: 1 });
  };

  return (
    <div className="relative w-full h-[480px] lg:h-[520px] rounded-xl bg-surface-container-lowest border border-outline-variant/30 overflow-hidden shadow-2xl">
      {/* Actual Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-10" />

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
          onClick={handleResetProjection}
          className="w-8 h-8 rounded-lg bg-surface-container-low/90 backdrop-blur-md hover:bg-surface-container border border-outline-variant/40 text-on-surface flex items-center justify-center shadow-md transition-colors"
          title="Reset Projection"
          type="button"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import type { DisasterEvent } from '../types/disaster';

interface NearbyAlertsModalProps {
  incidents: DisasterEvent[];
  onClose: () => void;
}

// Haversine distance in km
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export const NearbyAlertsModal: React.FC<NearbyAlertsModalProps> = ({ incidents, onClose }) => {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          setLocationError("Could not get your location. Please enable GPS to see local alerts.");
        }
      );
    } else {
      setLocationError("Geolocation is not supported by your browser.");
    }
  }, []);

  // Filter to incidents within ~2000 km
  const localIncidents = userLocation 
    ? incidents.filter(inc => {
        const dist = calculateDistanceKm(userLocation[0], userLocation[1], inc.coordinates[0], inc.coordinates[1]);
        return dist <= 2000;
      }).sort((a, b) => {
        const distA = calculateDistanceKm(userLocation[0], userLocation[1], a.coordinates[0], a.coordinates[1]);
        const distB = calculateDistanceKm(userLocation[0], userLocation[1], b.coordinates[0], b.coordinates[1]);
        return distA - distB;
      })
    : [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-surface-container border border-outline-variant/30 rounded-xl p-panel-padding-spacious shadow-2xl relative overflow-hidden flex flex-col max-h-[80vh]">
        
        <button onClick={onClose} className="absolute top-4 right-4 text-outline hover:text-on-surface transition-colors z-20">
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50 z-10"></div>

        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div className="p-2 bg-primary/10 rounded-lg">
            <AlertTriangle className="text-primary" size={24} />
          </div>
          <div>
            <h1 className="font-headline-md text-headline-md text-on-surface mt-1">Nearby Alerts</h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Active and recent disasters within 2,000km of your location.</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar relative z-10">
          {!userLocation && !locationError && (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-surface-container-low rounded-lg border border-outline-variant/30">
              <span className="material-symbols-outlined animate-spin text-primary text-3xl mb-2">sync</span>
              <p className="text-on-surface font-medium">Requesting Local Area Access...</p>
              <p className="text-on-surface-variant text-sm mt-1">Waiting for browser permission to show alerts near you.</p>
            </div>
          )}

          {locationError && (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-error-container/20 rounded-lg border border-error/30">
              <AlertTriangle className="text-error mb-2" size={32} />
              <p className="text-error font-medium">{locationError}</p>
            </div>
          )}

          {userLocation && localIncidents.length === 0 && (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-surface-container-low rounded-lg border border-outline-variant/30">
              <ShieldCheck className="text-primary mb-2" size={32} />
              <p className="text-on-surface font-medium">No Active Local Threats</p>
              <p className="text-on-surface-variant text-sm mt-1">There are no major disasters reported within 2,000km of your location.</p>
            </div>
          )}

          {userLocation && localIncidents.map((incident) => {
            const dist = calculateDistanceKm(userLocation[0], userLocation[1], incident.coordinates[0], incident.coordinates[1]);
            
            return (
              <div key={incident.id} className="bg-surface-container-low p-4 rounded-lg border border-outline-variant/30 flex flex-col gap-2 relative overflow-hidden group">
                <div className={"absolute left-0 top-0 bottom-0 w-1 " + (incident.severity === 'extreme' ? 'bg-error' : incident.severity === 'high' ? 'bg-tertiary' : 'bg-primary')}></div>
                
                <div className="flex justify-between items-start pl-2">
                  <h3 className="text-on-surface font-medium">{incident.title}</h3>
                  <span className="text-xs font-label-mono-sm px-2 py-1 bg-surface-container-highest rounded text-on-surface-variant whitespace-nowrap">
                    {dist} km away
                  </span>
                </div>
                
                <p className="text-on-surface-variant text-sm pl-2 line-clamp-2">{incident.summary}</p>
                
                <div className="flex items-center gap-2 pl-2 mt-2">
                  <span className={"text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider " + (
                    incident.severity === 'extreme' ? 'bg-error/20 text-error' :
                    incident.severity === 'high' ? 'bg-tertiary/20 text-tertiary' :
                    'bg-primary/20 text-primary'
                  )}>
                    {incident.severity}
                  </span>
                  <span className="text-xs text-outline">{new Date(incident.timestamp).toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export type DisasterType = 
  | 'EARTHQUAKE' 
  | 'WILDFIRE' 
  | 'CYCLONE' 
  | 'FLOOD' 
  | 'TSUNAMI'
  | 'VOLCANO'
  | 'TORNADO'
  | 'LANDSLIDE'
  | 'HEATWAVE'
  | 'BLIZZARD'
  | 'AVALANCHE'
  | 'SOLAR_STORM'
  | 'EPIDEMIC'
  | 'DROUGHT';

export type DisasterSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface DisasterEvent {
  id: string;
  type: DisasterType;
  title: string;
  locationName: string;
  region: string;
  coordinates: [number, number]; // [lat, lng]
  severity: DisasterSeverity;
  timestamp: string;
  summary: string;
  metrics?: Record<string, any>;
  sources?: { id: string; name: string }[];
  location: {
    type: 'Point';
    coordinates: [number, number]; // GeoJSON uses [lng, lat]
  };
}

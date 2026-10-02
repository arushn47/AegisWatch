import { DisasterType } from '../types/disaster';

export const DISASTER_COLORS: Record<DisasterType, string> = {
  // User provided colors
  EARTHQUAKE: '#c2692a',
  WILDFIRE: '#DE2626',
  CYCLONE: '#6BFFF0',
  FLOOD: '#4790FF',
  TSUNAMI: '#3D5AFE', // Brightened from #0000C4 for dark mode visibility
  
  // AI assigned colors matching disaster semantics
  VOLCANO: '#FF3D00', // Deep intense orange (Magma)      // Vivid magma red-orange
  TORNADO: '#A3B1C6',      // Storm cloud grey
  LANDSLIDE: '#8B633D',    // Earthy brown
  HEATWAVE: '#FF0055',     // Intense crimson/pink-red to distinguish from wildfire
  BLIZZARD: '#B3E5FC',     // Icy frost blue
  AVALANCHE: '#E0E0E0',    // Stark snow white/light grey
  SOLAR_STORM: '#9D00FF',  // Neon radiation purple
  EPIDEMIC: '#00FF66',     // Biohazard neon green
  DROUGHT: '#D4A373',      // Dry cracked earth / sand yellow
};

export function getDisasterColor(type: DisasterType): string {
  return DISASTER_COLORS[type] || '#FFFFFF';
}

/**
 * Geographic utility functions for coordinate normalization and formatting.
 */

/**
 * Normalizes any longitude value to the standard geographic range [-180, +180].
 * Correctly accounts for continuous horizontal map panning and wrapping.
 * Example: 210.6588° -> -149.3412°
 */
export function normalizeLongitude(lng: number): number {
  if (isNaN(lng)) return 0;
  // Standard mathematical wrap to (-180, 180]
  let normalized = ((((lng + 180) % 360) + 360) % 360) - 180;
  // If normalized to -180 but original lng was positive, or floating point rounding:
  if (normalized === -180 && lng > 0) {
    normalized = 180;
  }
  return normalized;
}

/**
 * Clamps latitude to valid geographic range [-90, +90].
 */
export function normalizeLatitude(lat: number): number {
  if (isNaN(lat)) return 0;
  return Math.max(-90, Math.min(90, lat));
}

/**
 * Formats coordinates for telemetry display with consistent 4-decimal precision.
 */
export function formatTelemetryCoords(
  lat: number,
  lng: number
): { lat: string; lng: string } {
  const normLat = normalizeLatitude(lat);
  const normLng = normalizeLongitude(lng);

  return {
    lat: normLat.toFixed(4),
    lng: normLng.toFixed(4),
  };
}

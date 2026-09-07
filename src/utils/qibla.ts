/** Kaaba coordinates (Masjid al-Haram). */
export const KAABA = {
  latitude: 21.422487,
  longitude: 39.826206,
} as const;

/** Great-circle initial bearing from user location to Kaaba (0–360°, clockwise from true north). */
export function calculateQiblaBearing(latitude: number, longitude: number): number {
  const lat1 = (latitude * Math.PI) / 180;
  const lat2 = (KAABA.latitude * Math.PI) / 180;
  const dLon = ((KAABA.longitude - longitude) * Math.PI) / 180;

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

/** Haversine distance in kilometres. */
export function calculateDistanceToKaaba(latitude: number, longitude: number): number {
  const R = 6371;
  const dLat = ((KAABA.latitude - latitude) * Math.PI) / 180;
  const dLon = ((KAABA.longitude - longitude) * Math.PI) / 180;
  const lat1 = (latitude * Math.PI) / 180;
  const lat2 = (KAABA.latitude * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function formatQiblaDirection(bearing: number): string {
  const directions = ['K', 'KD', 'D', 'GD', 'G', 'GB', 'B', 'KB'];
  const index = Math.round(bearing / 45) % 8;
  return `${Math.round(bearing)}° ${directions[index]}`;
}

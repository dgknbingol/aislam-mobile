import geomagnetism from 'geomagnetism';

/** Magnetic declination in degrees (east positive) for WGS84 coordinates. */
export function getMagneticDeclination(latitude: number, longitude: number): number {
  try {
    return geomagnetism.model().point([latitude, longitude]).decl;
  } catch {
    return 0;
  }
}

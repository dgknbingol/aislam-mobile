/** Cihaz koordinatlarında (Expo Sensors) eğim telafili manyetik heading → 0–360°. */

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/**
 * Accelerometer + magnetometer → manyetik kuzey (derece).
 * Android/Expo eksenleri: x sağ, y yukarı, z kullanıcıya doğru.
 */
export function headingFromSensors(magnetometer: Vec3, accelerometer: Vec3): number | null {
  const aLen = Math.hypot(accelerometer.x, accelerometer.y, accelerometer.z);
  const mLen = Math.hypot(magnetometer.x, magnetometer.y, magnetometer.z);
  if (aLen < 1e-3 || mLen < 1e-3) return null;

  // Gravity (cihazın “aşağı”sı)
  const gx = accelerometer.x / aLen;
  const gy = accelerometer.y / aLen;
  const gz = accelerometer.z / aLen;

  const mx = magnetometer.x / mLen;
  const my = magnetometer.y / mLen;
  const mz = magnetometer.z / mLen;

  // East = mag × gravity
  let ex = my * gz - mz * gy;
  let ey = mz * gx - mx * gz;
  let ez = mx * gy - my * gx;
  const eLen = Math.hypot(ex, ey, ez);
  if (eLen < 1e-3) return null;
  ex /= eLen;
  ey /= eLen;
  ez /= eLen;

  // North = gravity × east
  const nx = gy * ez - gz * ey;
  const ny = gz * ex - gx * ez;
  // nz unused for yaw when phone is roughly flat; still compute heading from n/e on horizontal

  // Telefonun +Y (üst kenar) → coğrafi açı (saat yönünde kuzeyden)
  // Expo/Android: atan2(-east, north) yaygın doğru yön
  const heading = (Math.atan2(-ex, nx) * 180) / Math.PI;
  if (!Number.isFinite(heading)) return null;
  return (heading + 360) % 360;
}

export function applyDeclination(magneticHeading: number, declinationDegrees: number): number {
  return (magneticHeading + declinationDegrees + 360) % 360;
}

export function shortestDelta(from: number, to: number): number {
  let delta = to - from;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return delta;
}

/** 0–180: iki açı arasındaki en küçük fark. */
export function angleDifference(a: number, b: number): number {
  return Math.abs(shortestDelta(a, b));
}

export function lowPass(previous: Vec3 | null, next: Vec3, alpha = 0.45): Vec3 {
  if (previous == null) return next;
  return {
    x: previous.x + alpha * (next.x - previous.x),
    y: previous.y + alpha * (next.y - previous.y),
    z: previous.z + alpha * (next.z - previous.z),
  };
}

/** Kıble ±4° (ör. kıble 160 ise 156–164). Tik + titreşim. */
export const QIBLA_ALIGN_THRESHOLD_DEG = 4;

import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';

import { getMagneticDeclination } from '../utils/magneticDeclination';

function resolveTrueHeading(
  data: Location.LocationHeadingObject,
  latitude: number | null,
  longitude: number | null,
): number | null {
  if (data.trueHeading >= 0) {
    return data.trueHeading;
  }
  if (data.magHeading < 0) {
    return null;
  }
  if (latitude != null && longitude != null) {
    const declination = getMagneticDeclination(latitude, longitude);
    return (data.magHeading + declination + 360) % 360;
  }
  return data.magHeading;
}

function smoothHeading(previous: number | null, next: number, alpha = 0.15): number {
  if (previous == null) return next;
  let delta = next - previous;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  const smoothed = previous + alpha * delta;
  return (smoothed + 360) % 360;
}

export function useCompassHeading(
  active: boolean,
  latitude: number | null = null,
  longitude: number | null = null,
) {
  const [heading, setHeading] = useState<number | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [usesTrueNorth, setUsesTrueNorth] = useState(false);
  const smoothedRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;

    let subscription: Location.LocationSubscription | null = null;
    let cancelled = false;

    async function start() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;

      if (status !== Location.PermissionStatus.GRANTED) {
        setIsAvailable(false);
        return;
      }

      try {
        subscription = await Location.watchHeadingAsync((data) => {
          const resolved = resolveTrueHeading(data, latitude, longitude);
          if (resolved == null) return;

          setUsesTrueNorth(data.trueHeading >= 0);
          smoothedRef.current = smoothHeading(smoothedRef.current, resolved);
          setHeading(smoothedRef.current);
        });
        if (!cancelled) {
          setIsAvailable(true);
        }
      } catch {
        if (!cancelled) {
          setIsAvailable(false);
        }
      }
    }

    void start();

    return () => {
      cancelled = true;
      subscription?.remove();
      smoothedRef.current = null;
      setHeading(null);
    };
  }, [active, latitude, longitude]);

  return { heading, isAvailable, usesTrueNorth };
}

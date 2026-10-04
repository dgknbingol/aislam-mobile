import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';

import { getMagneticDeclination } from '../utils/magneticDeclination';

const SMOOTH_ALPHA = 0.32;
/** expo-location: 0=none, 1=low, 2=medium, 3=high — kalibre edilmemişi atla. */
const MIN_HEADING_ACCURACY = 1;
const UI_UPDATE_MS = 120;

function resolveTrueHeading(
  data: Location.LocationHeadingObject,
  latitude: number | null,
  longitude: number | null,
): number | null {
  if (typeof data.accuracy === 'number' && data.accuracy < MIN_HEADING_ACCURACY) {
    return null;
  }

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

function shortestDelta(from: number, to: number): number {
  let delta = to - from;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return delta;
}

export function useCompassHeading(
  active: boolean,
  latitude: number | null = null,
  longitude: number | null = null,
): {
  /** Metin / bilgi kartı (throttle). */
  heading: number | null;
  /** Kadran animasyonu — UI thread. */
  headingSV: SharedValue<number>;
  isAvailable: boolean;
  usesTrueNorth: boolean;
} {
  const [heading, setHeading] = useState<number | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [usesTrueNorth, setUsesTrueNorth] = useState(false);
  const headingSV = useSharedValue(0);
  const smoothedRef = useRef<number | null>(null);
  const lastUiAtRef = useRef(0);

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

          const previous = smoothedRef.current;
          const next =
            previous == null
              ? resolved
              : (previous + SMOOTH_ALPHA * shortestDelta(previous, resolved) + 360) % 360;
          smoothedRef.current = next;
          headingSV.value = next;

          const now = Date.now();
          if (now - lastUiAtRef.current >= UI_UPDATE_MS) {
            lastUiAtRef.current = now;
            setHeading(next);
          }
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
  }, [active, headingSV, latitude, longitude]);

  return { heading, headingSV, isAvailable, usesTrueNorth };
}

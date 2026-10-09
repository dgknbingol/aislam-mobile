import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import {
  useFrameCallback,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

import { applyDeclination, shortestDelta } from '../utils/compassHeading';
import { getMagneticDeclination } from '../utils/magneticDeclination';

/**
 * OS heading (Rotation Vector / magnetometer) + UI lerp.
 * Gyro füzyonu APK'da eksen/kazanç yüzünden az dönme, takılma ve ışınlanma yapıyordu;
 * Expo Go çoğu cihazda salt OS kullandığı için orada sorun yoktu.
 */
const NEEDLE_LERP = 0.28;
/** Yeni OS örneğine yumuşak yaklaşım (1 = anında). */
const OS_TRACK = 0.55;

function mod360(n: number): number {
  return ((n % 360) + 360) % 360;
}

export function useCompassHeading(
  active: boolean,
  latitude: number | null = null,
  longitude: number | null = null,
): {
  heading: number | null;
  headingSV: SharedValue<number>;
  isAvailable: boolean;
  usesTrueNorth: boolean;
} {
  const [heading, setHeading] = useState<number | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [usesTrueNorth, setUsesTrueNorth] = useState(true);

  const targetSV = useSharedValue(0);
  const headingSV = useSharedValue(0);

  const continuousRef = useRef(0);
  const primedRef = useRef(false);
  const trueNorthRef = useRef(true);
  const lastUiRef = useRef(0);

  useFrameCallback((info) => {
    'worklet';
    if (!info.timeSincePreviousFrame) return;
    const dt = Math.min(info.timeSincePreviousFrame, 32);
    const a = 1 - Math.pow(1 - NEEDLE_LERP, dt / 16.67);
    headingSV.value += (targetSV.value - headingSV.value) * a;
    if (Math.abs(targetSV.value - headingSV.value) < 0.04) {
      headingSV.value = targetSV.value;
    }
  }, active);

  useEffect(() => {
    if (!active) return;

    let locSub: Location.LocationSubscription | null = null;
    let cancelled = false;

    primedRef.current = false;

    const paint = () => {
      targetSV.value = continuousRef.current;
      setUsesTrueNorth(trueNorthRef.current);
      const now = Date.now();
      if (now - lastUiRef.current >= 80) {
        lastUiRef.current = now;
        setHeading(mod360(continuousRef.current));
      }
    };

    const trackOs = (os: number) => {
      const h = mod360(os);
      if (!primedRef.current) {
        continuousRef.current = h;
        primedRef.current = true;
        headingSV.value = h;
        targetSV.value = h;
        setHeading(h);
        return;
      }
      continuousRef.current += shortestDelta(mod360(continuousRef.current), h) * OS_TRACK;
      paint();
    };

    void (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;
      if (status !== Location.PermissionStatus.GRANTED) {
        setIsAvailable(false);
        return;
      }

      const decl =
        latitude != null && longitude != null
          ? getMagneticDeclination(latitude, longitude)
          : 0;

      const readOsDegrees = (data: Location.LocationHeadingObject): number | null => {
        if (typeof data.accuracy === 'number' && data.accuracy < 0) return null;
        if (typeof data.trueHeading === 'number' && data.trueHeading >= 0) {
          trueNorthRef.current = true;
          return mod360(data.trueHeading);
        }
        if (typeof data.magHeading === 'number' && data.magHeading >= 0) {
          trueNorthRef.current = true;
          return mod360(applyDeclination(data.magHeading, decl));
        }
        return null;
      };

      try {
        locSub = await Location.watchHeadingAsync((data) => {
          const os = readOsDegrees(data);
          if (os == null) return;
          trackOs(os);
        });
        if (!cancelled) setIsAvailable(true);
      } catch {
        if (!cancelled) setIsAvailable(false);
      }
    })();

    return () => {
      cancelled = true;
      locSub?.remove();
      primedRef.current = false;
      setHeading(null);
    };
  }, [active, headingSV, latitude, longitude, targetSV]);

  return { heading, headingSV, isAvailable, usesTrueNorth };
}

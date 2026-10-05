import * as Location from 'expo-location';
import { Gyroscope } from 'expo-sensors';
import { useEffect, useRef, useState } from 'react';
import {
  useFrameCallback,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

import { applyDeclination, shortestDelta } from '../utils/compassHeading';
import { getMagneticDeclination } from '../utils/magneticDeclination';

const GYRO_MS = 16;
const GYRO_DEADZONE = 6;
const STOP_MS = 100;
const NEEDLE_LERP = 0.28;
/** 0.85 eksik dönüş biriktiriyordu (biz 160/kıble, store 172 + sola dön). */
const GYRO_GAIN = 1;
/** Durunca OS oturunca tek sefer hizala — store app ile aynı açı. */
const OS_STABLE_EPS = 2.2;
const OS_STABLE_COUNT = 4;

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
  const frozenRef = useRef(false);
  const lastGyroAtRef = useRef<number | null>(null);
  const lastOsRef = useRef<number | null>(null);
  const trueNorthRef = useRef(true);
  const lastUiRef = useRef(0);
  const osStableRef = useRef(0);
  const osPrevRef = useRef<number | null>(null);
  const needsOsSyncRef = useRef(false);

  useFrameCallback((info) => {
    'worklet';
    if (!info.timeSincePreviousFrame) return;
    const dt = Math.min(info.timeSincePreviousFrame, 32);
    const a = 1 - Math.pow(1 - NEEDLE_LERP, dt / 16.67);
    headingSV.value += (targetSV.value - headingSV.value) * a;
    if (Math.abs(targetSV.value - headingSV.value) < 0.08) {
      headingSV.value = targetSV.value;
    }
  }, active);

  useEffect(() => {
    if (!active) return;

    let locSub: Location.LocationSubscription | null = null;
    let gyroSub: { remove: () => void } | null = null;
    let cancelled = false;
    let stopTimer: ReturnType<typeof setTimeout> | null = null;

    primedRef.current = false;
    frozenRef.current = false;
    lastGyroAtRef.current = null;
    lastOsRef.current = null;
    osStableRef.current = 0;
    osPrevRef.current = null;
    needsOsSyncRef.current = false;

    const paintTarget = () => {
      targetSV.value = continuousRef.current;
      setUsesTrueNorth(trueNorthRef.current);
      const now = Date.now();
      if (now - lastUiRef.current >= 80) {
        lastUiRef.current = now;
        setHeading(mod360(continuousRef.current));
      }
    };

    const lockTo = (deg: number) => {
      const h = mod360(deg);
      if (!primedRef.current) {
        continuousRef.current = h;
      } else {
        continuousRef.current += shortestDelta(mod360(continuousRef.current), h);
      }
      primedRef.current = true;
      targetSV.value = continuousRef.current;
      headingSV.value = continuousRef.current;
      setHeading(h);
    };

    const freezeNow = () => {
      frozenRef.current = true;
      needsOsSyncRef.current = true;
      osStableRef.current = 0;
      osPrevRef.current = null;
      // Önce ekranı dondur (OS gecikmesiyle dönmesin)
      continuousRef.current = headingSV.value;
      targetSV.value = headingSV.value;
      setHeading(mod360(headingSV.value));
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

      try {
        locSub = await Location.watchHeadingAsync((data) => {
          if (typeof data.accuracy === 'number' && data.accuracy < 0) return;

          // Store / iPhone uygulamaları genelde trueHeading (coğrafi kuzey).
          let deg: number | null = null;
          if (typeof data.trueHeading === 'number' && data.trueHeading >= 0) {
            deg = data.trueHeading;
            trueNorthRef.current = true;
          } else if (typeof data.magHeading === 'number' && data.magHeading >= 0) {
            deg = applyDeclination(data.magHeading, decl);
            trueNorthRef.current = true;
          }
          if (deg == null) return;

          const os = mod360(deg);
          lastOsRef.current = os;

          if (!primedRef.current) {
            lockTo(os);
            frozenRef.current = true;
            needsOsSyncRef.current = false;
            return;
          }

          if (!frozenRef.current || !needsOsSyncRef.current) return;

          // OS artık oturdu mu? (gecikmeli akış bitti)
          if (osPrevRef.current != null && Math.abs(shortestDelta(osPrevRef.current, os)) < OS_STABLE_EPS) {
            osStableRef.current += 1;
          } else {
            osStableRef.current = 0;
          }
          osPrevRef.current = os;

          if (osStableRef.current >= OS_STABLE_COUNT) {
            lockTo(os);
            needsOsSyncRef.current = false;
            osStableRef.current = 0;
          }
        });
      } catch {
        if (!cancelled) setIsAvailable(false);
        return;
      }

      const gyroOk = await Gyroscope.isAvailableAsync();
      if (gyroOk) {
        Gyroscope.setUpdateInterval(GYRO_MS);
        gyroSub = Gyroscope.addListener(({ z }) => {
          const now = Date.now();
          const prev = lastGyroAtRef.current;
          lastGyroAtRef.current = now;
          if (prev == null || !primedRef.current) return;

          const dt = Math.min((now - prev) / 1000, 0.05);
          const dps = -z * (180 / Math.PI) * GYRO_GAIN;

          if (Math.abs(dps) < GYRO_DEADZONE) {
            if (stopTimer) clearTimeout(stopTimer);
            stopTimer = setTimeout(() => {
              freezeNow();
            }, STOP_MS);
            return;
          }

          if (stopTimer) {
            clearTimeout(stopTimer);
            stopTimer = null;
          }

          if (frozenRef.current) {
            frozenRef.current = false;
            needsOsSyncRef.current = false;
            if (lastOsRef.current != null) {
              lockTo(lastOsRef.current);
            }
          }

          continuousRef.current += dps * dt;
          paintTarget();
        });
      } else {
        locSub?.remove();
        locSub = await Location.watchHeadingAsync((data) => {
          if (typeof data.accuracy === 'number' && data.accuracy < 0) return;
          let deg: number | null = null;
          if (typeof data.trueHeading === 'number' && data.trueHeading >= 0) {
            deg = data.trueHeading;
          } else if (typeof data.magHeading === 'number' && data.magHeading >= 0) {
            deg = applyDeclination(data.magHeading, decl);
          }
          if (deg == null) return;
          lockTo(mod360(deg));
        });
      }

      if (!cancelled) setIsAvailable(true);
    })();

    return () => {
      cancelled = true;
      if (stopTimer) clearTimeout(stopTimer);
      locSub?.remove();
      gyroSub?.remove();
      primedRef.current = false;
      setHeading(null);
    };
  }, [active, headingSV, latitude, longitude, targetSV]);

  return { heading, headingSV, isAvailable, usesTrueNorth };
}

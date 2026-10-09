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

/** ~60 Hz hedef; cihaz daha seyrek verse de dt ile entegre edilir. */
const GYRO_MS = 16;
/** Sadece sensör gürültüsü — yüksek deadzone APK'da takılma yapıyordu. */
const GYRO_DEADZONE = 0.35;
const GYRO_GAIN = 1;
/** OS güncellemesinde yumuşak çekim (hard snap yok). */
const OS_BLEND_MOVING = 0.06;
const OS_BLEND_STILL = 0.22;
const STILL_DPS = 8;
const NEEDLE_LERP = 0.34;

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
  const lastGyroAtRef = useRef<number | null>(null);
  const lastOsRef = useRef<number | null>(null);
  const lastDpsRef = useRef(0);
  const trueNorthRef = useRef(true);
  const lastUiRef = useRef(0);

  useFrameCallback((info) => {
    'worklet';
    if (!info.timeSincePreviousFrame) return;
    const dt = Math.min(info.timeSincePreviousFrame, 32);
    const a = 1 - Math.pow(1 - NEEDLE_LERP, dt / 16.67);
    headingSV.value += (targetSV.value - headingSV.value) * a;
    if (Math.abs(targetSV.value - headingSV.value) < 0.05) {
      headingSV.value = targetSV.value;
    }
  }, active);

  useEffect(() => {
    if (!active) return;

    let locSub: Location.LocationSubscription | null = null;
    let gyroSub: { remove: () => void } | null = null;
    let cancelled = false;

    primedRef.current = false;
    lastGyroAtRef.current = null;
    lastOsRef.current = null;
    lastDpsRef.current = 0;

    const paintTarget = () => {
      targetSV.value = continuousRef.current;
      setUsesTrueNorth(trueNorthRef.current);
      const now = Date.now();
      if (now - lastUiRef.current >= 100) {
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

    /** OS / jiroskop birleşimi — ani sıçrama yok. */
    const blendTowardOs = (os: number, amount: number) => {
      if (!primedRef.current) {
        lockTo(os);
        return;
      }
      continuousRef.current += shortestDelta(mod360(continuousRef.current), os) * amount;
      paintTarget();
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
          lastOsRef.current = os;

          if (!primedRef.current) {
            lockTo(os);
            return;
          }

          // Hareketliyken az, durunca daha çok OS'a yaslan (doğruluk).
          const blend =
            Math.abs(lastDpsRef.current) < STILL_DPS ? OS_BLEND_STILL : OS_BLEND_MOVING;
          blendTowardOs(os, blend);
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

          const dt = Math.min(Math.max((now - prev) / 1000, 0), 0.05);
          const dps = -z * (180 / Math.PI) * GYRO_GAIN;
          lastDpsRef.current = dps;

          if (Math.abs(dps) >= GYRO_DEADZONE) {
            continuousRef.current += dps * dt;
            paintTarget();
          }
        });
      } else {
        // Salt OS — Expo Go'da bazen bu yol daha akıcı hissedilir.
        locSub?.remove();
        locSub = await Location.watchHeadingAsync((data) => {
          const os = readOsDegrees(data);
          if (os == null) return;
          lockTo(os);
        });
      }

      if (!cancelled) setIsAvailable(true);
    })();

    return () => {
      cancelled = true;
      locSub?.remove();
      gyroSub?.remove();
      primedRef.current = false;
      setHeading(null);
    };
  }, [active, headingSV, latitude, longitude, targetSV]);

  return { heading, headingSV, isAvailable, usesTrueNorth };
}

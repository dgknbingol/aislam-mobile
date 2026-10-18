import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import {
  runOnJS,
  useFrameCallback,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

import { getMagneticDeclination } from '../utils/magneticDeclination';

/**
 * Pusula — tek güvenilir kaynak: `Location.watchHeadingAsync`.
 *
 * Native kaynak doğrulaması (expo-location@19.0.8, `LocationModule.kt`):
 *  - Android: TYPE_MAGNETIC_FIELD + TYPE_ACCELEROMETER, `SENSOR_DELAY_NORMAL`.
 *    SENSOR_DELAY_NORMAL ≈ 200 ms (~5 Hz) → üst sınır burada.
 *    Üstüne `|Δazimuth| > 0.0355 rad (~2°)` AND `Δt > 50 ms` throttle
 *    (DEGREE_DELTA / TIME_DELTA sabitleri).
 *    `trueHeading = magHeading + GeomagneticField.declination`. İzin veya
 *    konum yoksa `trueHeading = -1`.
 *  - iOS: CLLocationManager.startUpdatingHeading (DeviceHeadingStreamer).
 *    CoreLocation declination + kalibrasyon + ekran yönelimi yönetir.
 *    Lokasyon servisi yoksa `trueHeading = -1`.
 *
 * **Native veri hızı sabit.** Lerp arada yoksa veri yaratamaz; τ'yi 20–30 ms'e
 * indirmek sadece 2° basamaklarını keskinleştirir, tepkiselliği artırmaz.
 * Gerçek anlamda hızlanmak için raw mag + accel (expo-sensors) kullanıp
 * tilt-compensated azimuth + vektör low-pass + screen rotation remap yapmak
 * gerekir — ayrı bir iş, çok daha karmaşık.
 *
 * Worklet güvenliği: frame callback'in çağırdığı tüm matematik **inline**.
 * Dış dosyaya 'worklet'; direktifi koymak Babel plugin'inin o dosyayı
 * işlemesini şart koşar — bu projede garanti değil. Riski almıyoruz.
 */

/** Varsayılan görsel yumuşatma zaman sabiti (ms). Alt sınır ~20 ms (Expo
 *  Android ~5 Hz sensör cap'i); 20'nin altı anlamsız. 40–60 iyi aralık. */
const DEFAULT_UI_TAU_MS = 50;
/** React state (sayısal gösterim) güncelleme aralığı. */
const STATE_UPDATE_MS = 180;
/** Hedefe bu kadar yaklaşınca snap et — sonsuz exponential approach'u bitir. */
const SNAP_EPSILON_DEG = 0.08;
/** Dev-only ölçüm toplama penceresi. */
const STATS_WINDOW_MS = 1000;

export interface CompassHeadingResult {
  /** Normalleştirilmiş 0..360, state throttle'lı. Sayısal metin için. */
  heading: number | null;
  /** Sürekli (unwrapped) açı. Animasyon için — rotate transform. */
  headingSV: SharedValue<number>;
  /** `watchHeadingAsync` kuruldu VE en az bir geçerli örnek geldi. */
  isAvailable: boolean | null;
  /** Üretilen heading gerçek kuzeye referanslı mı. */
  usesTrueNorth: boolean;
}

export interface UseCompassHeadingOptions {
  /** Yumuşatma zaman sabiti (ms). 20–30 ms çok tepkisel, 50–80 ms yumuşak. */
  smoothingTauMs?: number;
}

export function useCompassHeading(
  active: boolean,
  latitude: number | null = null,
  longitude: number | null = null,
  options: UseCompassHeadingOptions = {},
): CompassHeadingResult {
  const tauMs = Math.max(10, options.smoothingTauMs ?? DEFAULT_UI_TAU_MS);

  const [heading, setHeading] = useState<number | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [usesTrueNorth, setUsesTrueNorth] = useState(false);

  // Reanimated SharedValue + useFrameCallback → stabil referanslar.
  const headingSV = useSharedValue(0);
  const targetSV = useSharedValue(0);
  const tauSV = useSharedValue(tauMs);

  // Dev-only UI frame istatistikleri (worklet accumulator).
  const uiFrameCountSV = useSharedValue(0);
  const uiFrameSumMsSV = useSharedValue(0);
  const uiSnapCountSV = useSharedValue(0);

  const targetContinuousRef = useRef(0);
  const primedRef = useRef(false);
  const lastStateMsRef = useRef(0);

  // JS tarafı sensör olayı istatistikleri.
  const sensorStatsRef = useRef<{
    lastMs: number;
    count: number;
    dtSum: number;
    dtSumSq: number;
    absDeltaSum: number;
    maxAbsDelta: number;
    lastWindowMs: number;
    lastValueDeg: number | null;
  }>({
    lastMs: 0,
    count: 0,
    dtSum: 0,
    dtSumSq: 0,
    absDeltaSum: 0,
    maxAbsDelta: 0,
    lastWindowMs: 0,
    lastValueDeg: null,
  });

  // tauMs değişirse SV güncelle (effect'i yeniden kurmaya gerek yok).
  useEffect(() => {
    tauSV.value = tauMs;
  }, [tauMs, tauSV]);

  // UI thread yumuşatma — inline matematik, worklet garanti.
  const frame = useFrameCallback((info) => {
    'worklet';
    const dtMs = Math.max(1, info.timeSincePreviousFrame ?? 16);

    if (__DEV__) {
      uiFrameCountSV.value += 1;
      uiFrameSumMsSV.value += dtMs;
    }

    // α(dt) = 1 - exp(-dt/τ)
    const alpha = 1 - Math.exp(-dtMs / tauSV.value);

    // En kısa açısal yol — inline shortestDelta.
    const from = ((headingSV.value % 360) + 360) % 360;
    const to = ((targetSV.value % 360) + 360) % 360;
    let d = to - from;
    if (d > 180) d -= 360;
    else if (d < -180) d += 360;

    const absD = d < 0 ? -d : d;
    if (absD < SNAP_EPSILON_DEG) {
      // Snap: sonsuz exponential approach durur, headingSV = targetSV
      // (sürekli referansla hizalanır, 359↔0 sıçraması olmaz).
      headingSV.value = targetSV.value;
      if (__DEV__) uiSnapCountSV.value += 1;
    } else {
      headingSV.value = headingSV.value + alpha * d;
    }
  }, false);

  useEffect(() => {
    // Her oturum başında state'i sıfırla (önceki oturumdan artık değer yok).
    setHeading(null);
    setUsesTrueNorth(false);
    setIsAvailable(null);
    primedRef.current = false;
    lastStateMsRef.current = 0;
    targetContinuousRef.current = 0;
    headingSV.value = 0;
    targetSV.value = 0;

    if (!active) {
      frame.setActive(false);
      return;
    }

    frame.setActive(true);

    let cancelled = false;
    let sub: Location.LocationSubscription | null = null;
    let statsTimer: ReturnType<typeof setInterval> | null = null;

    // Konum ve declination geçerlilik kontrolü.
    const latOk =
      latitude != null && Number.isFinite(latitude) && Math.abs(latitude) <= 90;
    const lonOk =
      longitude != null && Number.isFinite(longitude) && Math.abs(longitude) <= 180;
    const rawDecl = latOk && lonOk ? getMagneticDeclination(latitude!, longitude!) : 0;
    const declination =
      Number.isFinite(rawDecl) && Math.abs(rawDecl) < 90 ? rawDecl : 0;

    // Dev-only: her saniyede özet log (olay başına değil).
    if (__DEV__) {
      sensorStatsRef.current = {
        lastMs: 0,
        count: 0,
        dtSum: 0,
        dtSumSq: 0,
        absDeltaSum: 0,
        maxAbsDelta: 0,
        lastWindowMs: Date.now(),
        lastValueDeg: null,
      };
      statsTimer = setInterval(() => {
        const s = sensorStatsRef.current;
        const uiCount = uiFrameCountSV.value;
        const uiSumMs = uiFrameSumMsSV.value;
        const snaps = uiSnapCountSV.value;
        uiFrameCountSV.value = 0;
        uiFrameSumMsSV.value = 0;
        uiSnapCountSV.value = 0;

        const sensorHz = s.count;
        const dtMean = s.count ? s.dtSum / s.count : 0;
        const dtVar = s.count ? s.dtSumSq / s.count - dtMean * dtMean : 0;
        const dtSd = dtVar > 0 ? Math.sqrt(dtVar) : 0;
        const absDeltaMean = s.count ? s.absDeltaSum / s.count : 0;
        const uiMean = uiCount ? uiSumMs / uiCount : 0;

        // eslint-disable-next-line no-console
        console.log(
          `[compass] sensor=${sensorHz}Hz dt=${dtMean.toFixed(0)}±${dtSd.toFixed(
            0,
          )}ms |Δ|=${absDeltaMean.toFixed(2)}° max=${s.maxAbsDelta.toFixed(
            1,
          )}°  ui=${uiCount}f dt=${uiMean.toFixed(1)}ms snaps=${snaps}  τ=${
            tauSV.value
          }ms`,
        );

        s.count = 0;
        s.dtSum = 0;
        s.dtSumSq = 0;
        s.absDeltaSum = 0;
        s.maxAbsDelta = 0;
        s.lastWindowMs = Date.now();
      }, STATS_WINDOW_MS);
    }

    void (async () => {
      try {
        const subscription = await Location.watchHeadingAsync((sample) => {
          if (cancelled) return;

          // Kaynak seçimi — iddiasız.
          const t = sample.trueHeading;
          const m = sample.magHeading;
          const trueValid = Number.isFinite(t) && t >= 0;
          const magValid = Number.isFinite(m) && m >= 0;

          let next: number | null = null;
          let fromTrue = false;

          if (trueValid) {
            next = t;
            fromTrue = true;
          } else if (magValid && latOk && lonOk) {
            next = m + declination;
            fromTrue = true; // declination uyguladık
          } else if (magValid) {
            next = m;
            fromTrue = false; // sadece manyetik
          }

          if (next == null || !Number.isFinite(next)) return;

          const normNext = ((next % 360) + 360) % 360;

          // Dev ölçüm — olay başına değil, pencerede toplanıyor.
          if (__DEV__) {
            const now = Date.now();
            const s = sensorStatsRef.current;
            if (s.lastMs > 0) {
              const dt = now - s.lastMs;
              s.dtSum += dt;
              s.dtSumSq += dt * dt;
            }
            if (s.lastValueDeg != null) {
              let dAng = normNext - s.lastValueDeg;
              if (dAng > 180) dAng -= 360;
              else if (dAng < -180) dAng += 360;
              const absA = dAng < 0 ? -dAng : dAng;
              s.absDeltaSum += absA;
              if (absA > s.maxAbsDelta) s.maxAbsDelta = absA;
            }
            s.lastMs = now;
            s.lastValueDeg = normNext;
            s.count += 1;
          }

          if (!primedRef.current) {
            targetContinuousRef.current = normNext;
            targetSV.value = normNext;
            headingSV.value = normNext;
            primedRef.current = true;
            setHeading(normNext);
            setUsesTrueNorth(fromTrue);
            setIsAvailable(true); // ancak gerçek örnek geldiğinde
            lastStateMsRef.current = Date.now();
            return;
          }

          // Sürekli (unwrapped) hedef — en kısa yolla ilerle, 359↔0 ve ±180
          // sınırında tam tur yok.
          const prevNorm =
            ((targetContinuousRef.current % 360) + 360) % 360;
          let delta = normNext - prevNorm;
          if (delta > 180) delta -= 360;
          else if (delta < -180) delta += 360;
          targetContinuousRef.current += delta;
          targetSV.value = targetContinuousRef.current;

          const now = Date.now();
          if (now - lastStateMsRef.current >= STATE_UPDATE_MS) {
            lastStateMsRef.current = now;
            setHeading(((targetContinuousRef.current % 360) + 360) % 360);
            setUsesTrueNorth(fromTrue);
          }
        });

        if (cancelled) {
          subscription.remove();
          return;
        }
        sub = subscription;
      } catch {
        if (cancelled) return;
        setIsAvailable(false);
      }
    })();

    return () => {
      cancelled = true;
      sub?.remove();
      sub = null;
      frame.setActive(false);
      if (statsTimer) clearInterval(statsTimer);
      primedRef.current = false;
    };
    // Stabil olanlar (SV/frame) deps dışında — Reanimated API garantisi.
    // tauSV güncellemesi ayrı effect'te; tauMs burada tetikleyici değil.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, latitude, longitude]);

  return { heading, headingSV, isAvailable, usesTrueNorth };
}

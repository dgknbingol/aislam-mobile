import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';

import type { TurkishCity } from '../constants/turkishCities';
import {
  fetchMonthlyPrayerTimes,
  getTodayPrayerDay,
  localDateKey,
  type MonthlyPrayerTimesResponse,
  type PrayerDay,
} from '../services/prayerTimesApi';
import { getDevicePositionFast } from '../services/deviceLocation';
import {
  setPrayerDaysForScheduling,
  syncPrayerNotifications,
} from '../services/prayerNotificationScheduler';
import { unregisterDeviceFromPrayerPush } from '../services/devicePushRegistration';

const STORAGE_KEY = '@aislam/location';
const PRAYER_TIMES_CACHE_PREFIX = '@aislam/prayer-times';

type LocationSource = 'manual' | 'gps';

interface StoredLocation {
  latitude: number;
  longitude: number;
  label?: string;
  source?: LocationSource;
}

interface LocationContextValue {
  latitude: number | null;
  longitude: number | null;
  locationLabel: string | null;
  locationSource: LocationSource | null;
  /** GPS izni veya manuel şehir seçimi ile güvenilir konum var. */
  hasTrustedLocation: boolean;
  isLoadingLocation: boolean;
  isUpdatingLocation: boolean;
  permissionDenied: boolean;
  monthlyPrayerTimes: MonthlyPrayerTimesResponse | null;
  todayPrayerDay: PrayerDay | undefined;
  isLoadingPrayerTimes: boolean;
  prayerTimesError: string | null;
  refreshPrayerTimes: () => Promise<void>;
  selectManualCity: (city: TurkishCity) => Promise<void>;
  refreshCurrentLocation: () => Promise<void>;
}

const LocationContext = createContext<LocationContextValue | null>(null);

async function readStoredLocation(): Promise<StoredLocation | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredLocation;
    if (typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number') {
      return parsed;
    }
  } catch {
    // ignore invalid cache
  }
  return null;
}

async function persistLocation(coords: StoredLocation): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(coords));
}

async function clearStoredLocation(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

function prayerTimesCacheKey(lat: number, lon: number, year: number, month: number): string {
  return `${PRAYER_TIMES_CACHE_PREFIX}:${year}-${month}:${lat.toFixed(3)}:${lon.toFixed(3)}`;
}

async function readCachedPrayerTimes(
  lat: number,
  lon: number,
): Promise<MonthlyPrayerTimesResponse | null> {
  const now = new Date();
  const cacheKey = prayerTimesCacheKey(lat, lon, now.getFullYear(), now.getMonth() + 1);
  const raw = await AsyncStorage.getItem(cacheKey);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as MonthlyPrayerTimesResponse;
    if (!parsed.days?.length) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function persistPrayerTimes(
  lat: number,
  lon: number,
  data: MonthlyPrayerTimesResponse,
): Promise<void> {
  const cacheKey = prayerTimesCacheKey(lat, lon, data.year, data.month);
  await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [locationSource, setLocationSource] = useState<LocationSource | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [monthlyPrayerTimes, setMonthlyPrayerTimes] =
    useState<MonthlyPrayerTimesResponse | null>(null);
  const [isLoadingPrayerTimes, setIsLoadingPrayerTimes] = useState(false);
  const [prayerTimesError, setPrayerTimesError] = useState<string | null>(null);
  /** Gece yarısı sonrası `today` seçiminin güncellenmesi için yerel takvim günü. */
  const [calendarDateKey, setCalendarDateKey] = useState(() => localDateKey());
  /** Geç gelen GPS/şehir yanıtlarının birbirini ezmesini engeller. */
  const locationUpdateSeqRef = useRef(0);

  useEffect(() => {
    const syncCalendarDate = () => {
      const next = localDateKey();
      setCalendarDateKey((prev) => (prev === next ? prev : next));
    };

    syncCalendarDate();
    const timer = setInterval(syncCalendarDate, 60_000);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncCalendarDate();
    });

    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, []);

  const clearLocationFeatures = useCallback(async () => {
    setLatitude(null);
    setLongitude(null);
    setLocationLabel(null);
    setLocationSource(null);
    setMonthlyPrayerTimes(null);
    setPrayerTimesError(null);
    setIsLoadingPrayerTimes(false);
    setPrayerDaysForScheduling([]);
    await clearStoredLocation();
    await unregisterDeviceFromPrayerPush();
    void syncPrayerNotifications();
  }, []);

  const applyCoords = useCallback(async (coords: StoredLocation & { source: LocationSource }) => {
    setLatitude(coords.latitude);
    setLongitude(coords.longitude);
    setLocationLabel(coords.label ?? null);
    setLocationSource(coords.source);
    await persistLocation(coords);
  }, []);

  const loadPrayerTimes = useCallback(async (lat: number, lon: number) => {
    setPrayerTimesError(null);

    const cached = await readCachedPrayerTimes(lat, lon);
    if (cached) {
      setMonthlyPrayerTimes(cached);
      setIsLoadingPrayerTimes(false);
      setPrayerDaysForScheduling(cached.days);
      void syncPrayerNotifications();
    } else {
      setIsLoadingPrayerTimes(true);
    }

    try {
      const data = await fetchMonthlyPrayerTimes(lat, lon);
      setMonthlyPrayerTimes(data);
      await persistPrayerTimes(lat, lon, data);
      setPrayerDaysForScheduling(data.days);
      void syncPrayerNotifications();
    } catch (error) {
      if (!cached) {
        setPrayerTimesError(
          error instanceof Error ? error.message : 'Ezan vakitleri yüklenemedi.',
        );
      }
    } finally {
      setIsLoadingPrayerTimes(false);
    }
  }, []);

  const refreshPrayerTimes = useCallback(async () => {
    if (latitude == null || longitude == null) return;
    await loadPrayerTimes(latitude, longitude);
  }, [latitude, longitude, loadPrayerTimes]);

  const selectManualCity = useCallback(
    async (city: TurkishCity) => {
      const seq = ++locationUpdateSeqRef.current;
      setIsUpdatingLocation(true);
      try {
        await applyCoords({
          latitude: city.latitude,
          longitude: city.longitude,
          label: city.name,
          source: 'manual',
        });
      } finally {
        if (locationUpdateSeqRef.current === seq) {
          setIsUpdatingLocation(false);
        }
      }
    },
    [applyCoords],
  );

  const refreshCurrentLocation = useCallback(async () => {
    const seq = ++locationUpdateSeqRef.current;
    setIsUpdatingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (locationUpdateSeqRef.current !== seq) return;
      if (status !== Location.PermissionStatus.GRANTED) {
        setPermissionDenied(true);
        return;
      }

      setPermissionDenied(false);
      const position = await getDevicePositionFast();
      if (locationUpdateSeqRef.current !== seq) return;

      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      // Önce konumu hemen yaz — reverse geocode takılsa bile spinner bitmesin / etiket görünsün.
      await applyCoords({
        latitude: lat,
        longitude: lon,
        label: 'Mevcut konum',
        source: 'gps',
      });
      if (locationUpdateSeqRef.current !== seq) return;
      setIsUpdatingLocation(false);

      try {
        const places = await Location.reverseGeocodeAsync({
          latitude: lat,
          longitude: lon,
        });
        if (locationUpdateSeqRef.current !== seq) return;
        const place = places[0];
        const resolved = place?.city ?? place?.district ?? null;
        if (resolved) {
          await applyCoords({
            latitude: lat,
            longitude: lon,
            label: resolved,
            source: 'gps',
          });
        }
      } catch {
        // "Mevcut konum" etiketi kalsın
      }
    } finally {
      if (locationUpdateSeqRef.current === seq) {
        setIsUpdatingLocation(false);
      }
    }
  }, [applyCoords]);

  useEffect(() => {
    let cancelled = false;

    async function initLocation() {
      setIsLoadingLocation(true);
      try {
        const stored = await readStoredLocation();

        // Manuel şehir: GPS izni olmasa da geçerli konum sayılır.
        if (stored?.source === 'manual' && !cancelled) {
          setLatitude(stored.latitude);
          setLongitude(stored.longitude);
          setLocationLabel(stored.label ?? null);
          setLocationSource('manual');
          const { status } = await Location.getForegroundPermissionsAsync();
          if (!cancelled) {
            setPermissionDenied(status !== Location.PermissionStatus.GRANTED);
          }
          return;
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;

        if (status !== Location.PermissionStatus.GRANTED) {
          setPermissionDenied(true);
          // Eski GPS / varsayılan İstanbul kaydını kullanma — ezan ve kıble kapalı.
          await clearLocationFeatures();
          return;
        }

        setPermissionDenied(false);

        // Kayıtlı GPS varsa hemen göster — taze fix arka planda gelsin.
        if (stored?.source === 'gps' && !cancelled) {
          setLatitude(stored.latitude);
          setLongitude(stored.longitude);
          setLocationLabel(stored.label ?? 'Mevcut konum');
          setLocationSource('gps');
          setIsLoadingLocation(false);
        }

        try {
          const position = await getDevicePositionFast();
          if (cancelled) return;
          await applyCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            label: stored?.label ?? 'Mevcut konum',
            source: 'gps',
          });
        } catch {
          if (!cancelled && !(stored?.source === 'gps')) {
            await clearLocationFeatures();
          }
        }
      } catch {
        if (!cancelled) {
          await clearLocationFeatures();
        }
      } finally {
        if (!cancelled) {
          setIsLoadingLocation(false);
        }
      }
    }

    void initLocation();

    return () => {
      cancelled = true;
    };
  }, [applyCoords, clearLocationFeatures]);

  const hasTrustedLocation =
    latitude != null &&
    longitude != null &&
    (locationSource === 'manual' || (locationSource === 'gps' && !permissionDenied));

  useEffect(() => {
    if (!hasTrustedLocation || latitude == null || longitude == null) return;
    void loadPrayerTimes(latitude, longitude);
  }, [hasTrustedLocation, latitude, longitude, loadPrayerTimes, calendarDateKey]);

  const todayPrayerDay = useMemo(() => {
    if (!monthlyPrayerTimes) return undefined;
    return getTodayPrayerDay(
      monthlyPrayerTimes.days,
      new Date(`${calendarDateKey}T12:00:00`),
    );
  }, [monthlyPrayerTimes, calendarDateKey]);

  const value = useMemo<LocationContextValue>(
    () => ({
      latitude: hasTrustedLocation ? latitude : null,
      longitude: hasTrustedLocation ? longitude : null,
      locationLabel: hasTrustedLocation ? locationLabel : null,
      locationSource: hasTrustedLocation ? locationSource : null,
      hasTrustedLocation,
      isLoadingLocation,
      isUpdatingLocation,
      permissionDenied,
      monthlyPrayerTimes: hasTrustedLocation ? monthlyPrayerTimes : null,
      todayPrayerDay: hasTrustedLocation ? todayPrayerDay : undefined,
      isLoadingPrayerTimes: hasTrustedLocation ? isLoadingPrayerTimes : false,
      prayerTimesError: hasTrustedLocation ? prayerTimesError : null,
      refreshPrayerTimes,
      selectManualCity,
      refreshCurrentLocation,
    }),
    [
      hasTrustedLocation,
      latitude,
      longitude,
      locationLabel,
      locationSource,
      isLoadingLocation,
      isUpdatingLocation,
      permissionDenied,
      monthlyPrayerTimes,
      todayPrayerDay,
      isLoadingPrayerTimes,
      prayerTimesError,
      refreshPrayerTimes,
      selectManualCity,
      refreshCurrentLocation,
    ],
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocationContext(): LocationContextValue {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    throw new Error('useLocationContext must be used within LocationProvider');
  }
  return ctx;
}

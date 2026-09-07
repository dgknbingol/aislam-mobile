import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { TurkishCity } from '../constants/turkishCities';
import {
  fetchMonthlyPrayerTimes,
  getTodayPrayerDay,
  type MonthlyPrayerTimesResponse,
  type PrayerDay,
} from '../services/prayerTimesApi';
import {
  setPrayerDaysForScheduling,
  syncPrayerNotifications,
} from '../services/prayerNotificationScheduler';

const STORAGE_KEY = '@aislam/location';
const PRAYER_TIMES_CACHE_PREFIX = '@aislam/prayer-times';

const DEFAULT_COORDS = {
  latitude: 41.0082,
  longitude: 28.9784,
  label: 'İstanbul',
};

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
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [monthlyPrayerTimes, setMonthlyPrayerTimes] =
    useState<MonthlyPrayerTimesResponse | null>(null);
  const [isLoadingPrayerTimes, setIsLoadingPrayerTimes] = useState(false);
  const [prayerTimesError, setPrayerTimesError] = useState<string | null>(null);

  const applyCoords = useCallback(async (coords: StoredLocation) => {
    setLatitude(coords.latitude);
    setLongitude(coords.longitude);
    setLocationLabel(coords.label ?? null);
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
      setIsUpdatingLocation(true);
      try {
        await applyCoords({
          latitude: city.latitude,
          longitude: city.longitude,
          label: city.name,
          source: 'manual',
        });
      } finally {
        setIsUpdatingLocation(false);
      }
    },
    [applyCoords],
  );

  const refreshCurrentLocation = useCallback(async () => {
    setIsUpdatingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) {
        setPermissionDenied(true);
        return;
      }

      setPermissionDenied(false);
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      let label = 'Mevcut konum';
      try {
        const places = await Location.reverseGeocodeAsync({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        const place = places[0];
        if (place?.city || place?.district) {
          label = place.city ?? place.district ?? label;
        }
      } catch {
        // keep default label
      }

      await applyCoords({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        label,
        source: 'gps',
      });
    } finally {
      setIsUpdatingLocation(false);
    }
  }, [applyCoords]);

  useEffect(() => {
    let cancelled = false;

    async function initLocation() {
      setIsLoadingLocation(true);
      let stored: StoredLocation | null = null;
      try {
        stored = await readStoredLocation();
        if (stored && !cancelled) {
          setLatitude(stored.latitude);
          setLongitude(stored.longitude);
          setLocationLabel(stored.label ?? null);
        }

        if (stored?.source === 'manual') {
          return;
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;

        if (status !== Location.PermissionStatus.GRANTED) {
          setPermissionDenied(true);
          if (!stored) {
            setLatitude(DEFAULT_COORDS.latitude);
            setLongitude(DEFAULT_COORDS.longitude);
            setLocationLabel(DEFAULT_COORDS.label);
          }
          return;
        }

        setPermissionDenied(false);
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (cancelled) return;

        await applyCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          label: stored?.label ?? 'Mevcut konum',
          source: 'gps',
        });
      } catch {
        if (!cancelled && !stored) {
          setLatitude(DEFAULT_COORDS.latitude);
          setLongitude(DEFAULT_COORDS.longitude);
          setLocationLabel(DEFAULT_COORDS.label);
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
  }, [applyCoords]);

  useEffect(() => {
    if (latitude == null || longitude == null) return;
    void loadPrayerTimes(latitude, longitude);
  }, [latitude, longitude, loadPrayerTimes]);

  const todayPrayerDay = useMemo(
    () => (monthlyPrayerTimes ? getTodayPrayerDay(monthlyPrayerTimes.days) : undefined),
    [monthlyPrayerTimes],
  );

  const value = useMemo<LocationContextValue>(
    () => ({
      latitude,
      longitude,
      locationLabel,
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
    }),
    [
      latitude,
      longitude,
      locationLabel,
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

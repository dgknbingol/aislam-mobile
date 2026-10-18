import * as Location from 'expo-location';

const LAST_KNOWN_MAX_AGE_MS = 10 * 60 * 1000;
const FRESH_FIX_TIMEOUT_MS = 6_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('location-timeout')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/**
 * Hızlı konum: önce son bilinen, sonra kısa süreli Low accuracy.
 * Balanced ile sonsuz beklemeyi önler (kapalı alanda sık takılıyordu).
 */
export async function getDevicePositionFast(): Promise<Location.LocationObject> {
  const lastKnown = await Location.getLastKnownPositionAsync({
    maxAge: LAST_KNOWN_MAX_AGE_MS,
    requiredAccuracy: 2000,
  });

  try {
    return await withTimeout(
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low,
        mayShowUserSettingsDialog: false,
      }),
      FRESH_FIX_TIMEOUT_MS,
    );
  } catch {
    if (lastKnown) return lastKnown;
  }

  // Son çare — biraz daha yüksek doğruluk, yine süre sınırı
  try {
    return await withTimeout(
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        mayShowUserSettingsDialog: false,
      }),
      FRESH_FIX_TIMEOUT_MS,
    );
  } catch {
    if (lastKnown) return lastKnown;
    throw new Error('Konum alınamadı');
  }
}

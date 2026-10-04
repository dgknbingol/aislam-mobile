import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { AI_CONFIG } from '../config/ai';
import { ensureAppUserId } from './appUserStorage';
import {
  loadAllCompetitionNotificationSettings,
  loadAllDailyContentNotificationSettings,
  loadAllPrayerNotificationSettings,
} from './notificationSettingsStorage';

const LOCATION_STORAGE_KEY = '@aislam/location';

interface StoredLocation {
  latitude: number;
  longitude: number;
}

let registerInFlight: Promise<void> | null = null;

async function readStoredLocation(): Promise<StoredLocation | null> {
  try {
    const raw = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredLocation>;
    if (
      typeof parsed.latitude !== 'number' ||
      typeof parsed.longitude !== 'number' ||
      Number.isNaN(parsed.latitude) ||
      Number.isNaN(parsed.longitude)
    ) {
      return null;
    }
    return { latitude: parsed.latitude, longitude: parsed.longitude };
  } catch {
    return null;
  }
}

/** Native FCM (Android) / APNs (iOS) token — Expo Push servisi kullanılmaz. */
async function getNativePushToken(): Promise<string | null> {
  try {
    const result = await Notifications.getDevicePushTokenAsync();
    const token = typeof result.data === 'string' ? result.data.trim() : '';
    return token || null;
  } catch (error) {
    console.warn('[push] Native device push token alınamadı', error);
    return null;
  }
}

/** Tüm bildirim prefs + token → sunucu (ezan / günlük / yarışma). */
export async function registerDeviceForPrayerPush(): Promise<void> {
  if (registerInFlight) {
    await registerInFlight;
    return;
  }

  registerInFlight = (async () => {
    const permission = await Notifications.getPermissionsAsync();
    if (permission.status !== Notifications.PermissionStatus.GRANTED) {
      await unregisterDeviceFromPrayerPush();
      return;
    }

    const location = await readStoredLocation();
    if (!location) return;

    const pushToken = await getNativePushToken();
    if (!pushToken) return;

    const deviceId = await ensureAppUserId();
    const [prayers, daily, competition] = await Promise.all([
      loadAllPrayerNotificationSettings(),
      loadAllDailyContentNotificationSettings(),
      loadAllCompetitionNotificationSettings(),
    ]);

    const response = await fetch(`${AI_CONFIG.ragBaseUrl}/api/notifications/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({
        deviceId,
        pushToken,
        platform: Platform.OS,
        latitude: location.latitude,
        longitude: location.longitude,
        prayers,
        daily,
        competition,
        timezone: 'Europe/Istanbul',
      }),
    });

    if (!response.ok) {
      console.warn('[push] register failed', response.status);
    }
  })();

  try {
    await registerInFlight;
  } finally {
    registerInFlight = null;
  }
}

export async function unregisterDeviceFromPrayerPush(): Promise<void> {
  try {
    const deviceId = await ensureAppUserId();
    await fetch(`${AI_CONFIG.ragBaseUrl}/api/notifications/register`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({ deviceId }),
    });
  } catch {
    // offline / network — sessiz
  }
}

/** QA: sunucudan anında test push. */
export async function requestServerTestPush(): Promise<boolean> {
  try {
    await registerDeviceForPrayerPush();
    const deviceId = await ensureAppUserId();
    const response = await fetch(`${AI_CONFIG.ragBaseUrl}/api/notifications/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({
        deviceId,
        title: 'e-İslam test push',
        body: 'Sunucu push çalışıyor (FCM/APNs).',
      }),
    });
    if (!response.ok) return false;
    const data = (await response.json()) as { ok?: boolean };
    return data.ok === true;
  } catch {
    return false;
  }
}

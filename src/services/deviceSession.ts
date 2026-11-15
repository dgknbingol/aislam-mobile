import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { AI_CONFIG } from '../config/ai';
import { buildAppAttestPayload, clearAppAttestRegistration, markAppAttestRegistered } from './appAttest';
import { ensureAppUserId } from './appUserStorage';
import { preparePlayIntegrity, requestPlayIntegrityToken } from './playIntegrity';

const STORAGE_KEY = '@aislam/device_access_token_v1';
/** Yenileme payı — süreden 5 dk önce yeni token al. */
const REFRESH_SKEW_MS = 5 * 60 * 1000;

interface StoredDeviceSession {
  token: string;
  expiresAt: number;
  deviceId: string;
}

let memory: StoredDeviceSession | null = null;
let inFlight: Promise<string | null> | null = null;

async function loadStored(): Promise<StoredDeviceSession | null> {
  if (memory) return memory;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredDeviceSession>;
    if (
      typeof parsed.token !== 'string' ||
      typeof parsed.expiresAt !== 'number' ||
      typeof parsed.deviceId !== 'string'
    ) {
      return null;
    }
    memory = {
      token: parsed.token,
      expiresAt: parsed.expiresAt,
      deviceId: parsed.deviceId,
    };
    return memory;
  } catch {
    return null;
  }
}

async function persist(session: StoredDeviceSession): Promise<void> {
  memory = session;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // ignore
  }
}

function isFresh(session: StoredDeviceSession, deviceId: string): boolean {
  return (
    session.deviceId === deviceId &&
    typeof session.token === 'string' &&
    session.token.length > 0 &&
    session.expiresAt > Date.now() + REFRESH_SKEW_MS
  );
}

async function fetchChallenge(deviceId: string): Promise<string> {
  const response = await fetch(`${AI_CONFIG.ragBaseUrl}/api/auth/device-challenge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
    },
    body: JSON.stringify({ deviceId }),
  });
  if (!response.ok) {
    throw new Error(`device-challenge failed (${response.status})`);
  }
  const json = (await response.json()) as { challenge?: string };
  const challenge = typeof json.challenge === 'string' ? json.challenge.trim() : '';
  if (!challenge) {
    throw new Error('device-challenge empty');
  }
  return challenge;
}

/**
 * Sunucudan imzalı cihaz JWT.
 * Android: Play Integrity. iOS: App Attest.
 */
export async function ensureDeviceAccessToken(): Promise<string | null> {
  if (inFlight) return inFlight;

  inFlight = (async () => {
    const deviceId = await ensureAppUserId();
    const stored = await loadStored();
    if (stored && isFresh(stored, deviceId)) {
      return stored.token;
    }

    try {
      if (Platform.OS === 'android') {
        void preparePlayIntegrity();
      }

      let challenge: string | undefined;
      let integrityToken: string | undefined;
      let appAttest: Awaited<ReturnType<typeof buildAppAttestPayload>> = null;

      if (Platform.OS === 'android' || Platform.OS === 'ios') {
        challenge = await fetchChallenge(deviceId);
      }

      if (Platform.OS === 'android' && challenge) {
        integrityToken = (await requestPlayIntegrityToken(challenge)) ?? undefined;
      }

      if (Platform.OS === 'ios' && challenge) {
        appAttest = await buildAppAttestPayload(challenge);
      }

      const response = await fetch(`${AI_CONFIG.ragBaseUrl}/api/auth/device-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({
          deviceId,
          platform: Platform.OS,
          challenge,
          integrityToken,
          ...(appAttest ?? {}),
        }),
      });

      if (!response.ok) {
        // Sunucu bilinen key istemiyorsa local registration’ı sıfırla
        if (Platform.OS === 'ios' && response.status === 400) {
          try {
            const err = (await response.clone().json()) as { code?: string };
            if (err.code === 'APP_ATTEST_UNKNOWN_KEY') {
              await clearAppAttestRegistration();
            }
          } catch {
            // ignore
          }
        }
        console.warn('[device-session] failed', response.status);
        return stored?.deviceId === deviceId && stored.expiresAt > Date.now()
          ? stored.token
          : null;
      }

      const json = (await response.json()) as {
        accessToken?: string;
        expiresIn?: number;
        appAttestRegistered?: boolean;
      };
      const token = typeof json.accessToken === 'string' ? json.accessToken.trim() : '';
      const expiresIn =
        typeof json.expiresIn === 'number' && json.expiresIn > 0 ? json.expiresIn : 7 * 24 * 3600;
      if (!token) return null;

      if (json.appAttestRegistered) {
        await markAppAttestRegistered();
      }

      await persist({
        token,
        expiresAt: Date.now() + expiresIn * 1000,
        deviceId,
      });
      return token;
    } catch (error) {
      console.warn('[device-session] network', error);
      return stored?.deviceId === deviceId && stored.expiresAt > Date.now()
        ? stored.token
        : null;
    }
  })();

  try {
    return await inFlight;
  } finally {
    inFlight = null;
  }
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const KEY_ID_STORAGE = '@aislam/app_attest_key_id_v1';
const REGISTERED_STORAGE = '@aislam/app_attest_registered_v1';

export type AppAttestPayload = {
  appAttestKeyId: string;
  appAttestAttestation?: string;
  appAttestAssertion?: string;
};

async function getModule(): Promise<typeof import('@expo/app-integrity') | null> {
  if (Platform.OS !== 'ios') return null;
  try {
    return await import('@expo/app-integrity');
  } catch {
    return null;
  }
}

async function loadKeyId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(KEY_ID_STORAGE);
  } catch {
    return null;
  }
}

async function saveKeyId(keyId: string): Promise<void> {
  await AsyncStorage.setItem(KEY_ID_STORAGE, keyId);
}

async function isRegisteredLocally(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(REGISTERED_STORAGE)) === '1';
  } catch {
    return false;
  }
}

export async function markAppAttestRegistered(): Promise<void> {
  try {
    await AsyncStorage.setItem(REGISTERED_STORAGE, '1');
  } catch {
    // ignore
  }
}

export async function clearAppAttestRegistration(): Promise<void> {
  try {
    await AsyncStorage.removeItem(REGISTERED_STORAGE);
  } catch {
    // ignore
  }
}

/**
 * iOS App Attest: ilk sefer attestation, sonra assertion.
 * Destek yoksa / simulator → null (sunucu APP_ATTEST_ENABLED ise reddeder).
 */
export async function buildAppAttestPayload(challenge: string): Promise<AppAttestPayload | null> {
  if (Platform.OS !== 'ios') return null;

  const mod = await getModule();
  if (!mod || !mod.isSupported) {
    console.warn('[app-attest] not supported on this device');
    return null;
  }

  let keyId = await loadKeyId();
  if (!keyId) {
    keyId = await mod.generateKeyAsync();
    await saveKeyId(keyId);
    await clearAppAttestRegistration();
  }

  const registered = await isRegisteredLocally();
  if (!registered) {
    try {
      const attestation = await mod.attestKeyAsync(keyId, challenge);
      return {
        appAttestKeyId: keyId,
        appAttestAttestation: attestation,
      };
    } catch (error) {
      console.warn('[app-attest] attest failed, regenerating key', error);
      keyId = await mod.generateKeyAsync();
      await saveKeyId(keyId);
      await clearAppAttestRegistration();
      const attestation = await mod.attestKeyAsync(keyId, challenge);
      return {
        appAttestKeyId: keyId,
        appAttestAttestation: attestation,
      };
    }
  }

  try {
    const assertion = await mod.generateAssertionAsync(keyId, challenge);
    return {
      appAttestKeyId: keyId,
      appAttestAssertion: assertion,
    };
  } catch (error) {
    console.warn('[app-attest] assertion failed, will re-attest next time', error);
    await clearAppAttestRegistration();
    const attestation = await mod.attestKeyAsync(keyId, challenge);
    return {
      appAttestKeyId: keyId,
      appAttestAttestation: attestation,
    };
  }
}

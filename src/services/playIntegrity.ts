import { Platform } from 'react-native';

const CLOUD_PROJECT_NUMBER =
  process.env.EXPO_PUBLIC_PLAY_INTEGRITY_CLOUD_PROJECT_NUMBER?.trim() || '415198635831';

let prepared = false;
let preparePromise: Promise<void> | null = null;

async function getModule(): Promise<typeof import('@expo/app-integrity') | null> {
  if (Platform.OS !== 'android') return null;
  try {
    return await import('@expo/app-integrity');
  } catch {
    return null;
  }
}

export async function preparePlayIntegrity(): Promise<void> {
  if (Platform.OS !== 'android' || prepared) return;
  if (preparePromise) return preparePromise;

  preparePromise = (async () => {
    const mod = await getModule();
    if (!mod) return;
    try {
      await mod.prepareIntegrityTokenProviderAsync(CLOUD_PROJECT_NUMBER);
      prepared = true;
    } catch (error) {
      console.warn('[integrity] prepare failed', error);
      prepared = false;
      throw error;
    } finally {
      preparePromise = null;
    }
  })();

  return preparePromise;
}

/**
 * Play Integrity token for the given requestHash (server challenge).
 * iOS / unavailable → null (server skips when not Android).
 */
export async function requestPlayIntegrityToken(requestHash: string): Promise<string | null> {
  if (Platform.OS !== 'android') return null;

  const mod = await getModule();
  if (!mod) return null;

  const tryRequest = async () => mod.requestIntegrityCheckAsync(requestHash);

  try {
    if (!prepared) {
      await preparePlayIntegrity();
    }
    return await tryRequest();
  } catch (error: unknown) {
    const code =
      error && typeof error === 'object' && 'code' in error
        ? String((error as { code?: string }).code)
        : '';
    if (code.includes('PROVIDER_INVALID') || code.includes('INTEGRITY')) {
      prepared = false;
      try {
        await preparePlayIntegrity();
        return await tryRequest();
      } catch (retryError) {
        console.warn('[integrity] request failed after re-prepare', retryError);
        return null;
      }
    }
    console.warn('[integrity] request failed', error);
    return null;
  }
}

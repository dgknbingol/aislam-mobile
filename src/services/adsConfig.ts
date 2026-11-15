import AsyncStorage from '@react-native-async-storage/async-storage';

import { AI_CONFIG } from '../config/ai';
import { apiClientHeaders } from './apiClientHeaders';

export interface AdsConfig {
  bannerEnabled: boolean;
  interstitialEnabled: boolean;
  appOpenEnabled: boolean;
  rewardedEnabled: boolean;
  interstitialCooldownMs: number;
  appOpenCooldownMs: number;
  rewardedDailyMax: number;
}

export const DEFAULT_ADS_CONFIG: AdsConfig = {
  bannerEnabled: true,
  interstitialEnabled: true,
  appOpenEnabled: true,
  rewardedEnabled: true,
  interstitialCooldownMs: 2 * 60 * 1000,
  appOpenCooldownMs: 30 * 60 * 1000,
  rewardedDailyMax: 5,
};

const STORAGE_KEY = '@aislam/ads_remote_config_v1';

let memoryConfig: AdsConfig = { ...DEFAULT_ADS_CONFIG };
let hydratePromise: Promise<void> | null = null;
let lastFetchAt = 0;
const MIN_FETCH_INTERVAL_MS = 60_000;

function normalize(raw: Partial<AdsConfig> | null | undefined): AdsConfig {
  return {
    bannerEnabled: raw?.bannerEnabled ?? DEFAULT_ADS_CONFIG.bannerEnabled,
    interstitialEnabled: raw?.interstitialEnabled ?? DEFAULT_ADS_CONFIG.interstitialEnabled,
    appOpenEnabled: raw?.appOpenEnabled ?? DEFAULT_ADS_CONFIG.appOpenEnabled,
    rewardedEnabled: raw?.rewardedEnabled ?? DEFAULT_ADS_CONFIG.rewardedEnabled,
    interstitialCooldownMs:
      typeof raw?.interstitialCooldownMs === 'number' && raw.interstitialCooldownMs > 0
        ? raw.interstitialCooldownMs
        : DEFAULT_ADS_CONFIG.interstitialCooldownMs,
    appOpenCooldownMs:
      typeof raw?.appOpenCooldownMs === 'number' && raw.appOpenCooldownMs > 0
        ? raw.appOpenCooldownMs
        : DEFAULT_ADS_CONFIG.appOpenCooldownMs,
    rewardedDailyMax:
      typeof raw?.rewardedDailyMax === 'number' && raw.rewardedDailyMax >= 0
        ? raw.rewardedDailyMax
        : DEFAULT_ADS_CONFIG.rewardedDailyMax,
  };
}

async function persist(config: AdsConfig): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // ignore
  }
}

/** Senkron okuma — bellek (önce hydrate/refresh çağır). */
export function getAdsConfig(): AdsConfig {
  return memoryConfig;
}

export async function hydrateAdsConfig(): Promise<AdsConfig> {
  if (hydratePromise) {
    await hydratePromise;
    return memoryConfig;
  }
  hydratePromise = (async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      memoryConfig = normalize(JSON.parse(raw) as Partial<AdsConfig>);
    } catch {
      // defaults
    }
  })();
  await hydratePromise;
  return memoryConfig;
}

/**
 * Sunucudan çeker, cache’ler.
 * force=false iken en fazla 60 sn’de bir network.
 */
export async function refreshAdsConfig(options?: { force?: boolean }): Promise<AdsConfig> {
  await hydrateAdsConfig();
  const now = Date.now();
  if (!options?.force && now - lastFetchAt < MIN_FETCH_INTERVAL_MS) {
    return memoryConfig;
  }

  try {
    const response = await fetch(`${AI_CONFIG.ragBaseUrl}/api/config/ads`, {
      headers: await apiClientHeaders(false),
    });
    if (!response.ok) {
      return memoryConfig;
    }
    const json = (await response.json()) as Partial<AdsConfig>;
    memoryConfig = normalize(json);
    lastFetchAt = now;
    await persist(memoryConfig);
  } catch {
    // offline → cache / default
  }
  return memoryConfig;
}

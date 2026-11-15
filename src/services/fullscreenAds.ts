import AsyncStorage from '@react-native-async-storage/async-storage';

import { getAppOpenAdUnitId, getInterstitialAdUnitId, isNativeAdsAvailable } from '../constants/ads';
import { getAdsConfig, hydrateAdsConfig } from './adsConfig';
import { preloadRewardedAd } from './rewardedAds';

const COOLDOWN_STORAGE_KEY = '@aislam/fullscreen_ad_cooldowns_v1';

type AdLike = {
  loaded: boolean;
  load: () => void;
  show: () => Promise<void>;
  addAdEventListener: (type: string, listener: (...args: unknown[]) => void) => () => void;
};

let interstitial: AdLike | null = null;
let appOpen: AdLike | null = null;
let interstitialLoading = false;
let appOpenLoading = false;
let lastInterstitialShownAt = 0;
let lastAppOpenShownAt = 0;
let hydratePromise: Promise<void> | null = null;
let adsModule: typeof import('react-native-google-mobile-ads') | null = null;

function getAdsModule(): typeof import('react-native-google-mobile-ads') | null {
  if (!isNativeAdsAvailable()) {
    return null;
  }
  if (adsModule) {
    return adsModule;
  }
  try {
    adsModule = require('react-native-google-mobile-ads') as typeof import('react-native-google-mobile-ads');
    return adsModule;
  } catch {
    return null;
  }
}

function requestOptions() {
  return { requestNonPersonalizedAdsOnly: true as const };
}

async function hydrateCooldowns(): Promise<void> {
  if (hydratePromise) {
    return hydratePromise;
  }
  hydratePromise = (async () => {
    try {
      const raw = await AsyncStorage.getItem(COOLDOWN_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { interstitial?: number; appOpen?: number };
      if (typeof parsed.interstitial === 'number' && parsed.interstitial > lastInterstitialShownAt) {
        lastInterstitialShownAt = parsed.interstitial;
      }
      if (typeof parsed.appOpen === 'number' && parsed.appOpen > lastAppOpenShownAt) {
        lastAppOpenShownAt = parsed.appOpen;
      }
    } catch {
      // depo okunamazsa bellek cooldown ile devam
    }
  })();
  return hydratePromise;
}

async function persistCooldowns(): Promise<void> {
  try {
    await AsyncStorage.setItem(
      COOLDOWN_STORAGE_KEY,
      JSON.stringify({
        interstitial: lastInterstitialShownAt,
        appOpen: lastAppOpenShownAt,
      }),
    );
  } catch {
    // ignore
  }
}

function attachReloadOnClose(ad: AdLike, reload: () => void): void {
  const mod = getAdsModule();
  if (!mod) return;
  ad.addAdEventListener(mod.AdEventType.CLOSED, () => {
    reload();
  });
  ad.addAdEventListener(mod.AdEventType.ERROR, () => {
    reload();
  });
}

function loadInterstitial(): void {
  const mod = getAdsModule();
  if (!mod || interstitialLoading) return;

  interstitialLoading = true;
  try {
    const next = mod.InterstitialAd.createForAdRequest(
      getInterstitialAdUnitId(),
      requestOptions(),
    ) as unknown as AdLike;
    interstitial = next;
    attachReloadOnClose(next, () => {
      interstitial = null;
      interstitialLoading = false;
      loadInterstitial();
    });
    next.addAdEventListener(mod.AdEventType.LOADED, () => {
      interstitialLoading = false;
    });
    next.addAdEventListener(mod.AdEventType.ERROR, () => {
      interstitialLoading = false;
      interstitial = null;
    });
    next.load();
  } catch {
    interstitialLoading = false;
    interstitial = null;
  }
}

function loadAppOpen(): void {
  const mod = getAdsModule();
  if (!mod || appOpenLoading) return;

  appOpenLoading = true;
  try {
    const next = mod.AppOpenAd.createForAdRequest(
      getAppOpenAdUnitId(),
      requestOptions(),
    ) as unknown as AdLike;
    appOpen = next;
    attachReloadOnClose(next, () => {
      appOpen = null;
      appOpenLoading = false;
      loadAppOpen();
    });
    next.addAdEventListener(mod.AdEventType.LOADED, () => {
      appOpenLoading = false;
    });
    next.addAdEventListener(mod.AdEventType.ERROR, () => {
      appOpenLoading = false;
      appOpen = null;
    });
    next.load();
  } catch {
    appOpenLoading = false;
    appOpen = null;
  }
}

/** AdMob init sonrası çağır — interstitial + app open + rewarded ön yükleme. */
export function preloadFullscreenAds(): void {
  if (!isNativeAdsAvailable()) return;
  void hydrateCooldowns();
  void hydrateAdsConfig();
  loadInterstitial();
  loadAppOpen();
  preloadRewardedAd();
}

function canShowByCooldown(lastShownAt: number, cooldownMs: number): boolean {
  if (lastShownAt <= 0) return true;
  return Date.now() - lastShownAt >= cooldownMs;
}

/**
 * Uygunsa interstitial gösterir.
 * @returns true = reklam gösterildi (veya gösterilmeye başlandı)
 */
export async function showInterstitialIfEligible(options?: {
  /** Premium kullanıcıda gösterme */
  isPremium?: boolean;
  /** Cooldown'u yok say (nadiren kullan) */
  ignoreCooldown?: boolean;
}): Promise<boolean> {
  if (options?.isPremium || !isNativeAdsAvailable()) {
    return false;
  }
  await hydrateCooldowns();
  await hydrateAdsConfig();
  const config = getAdsConfig();
  if (!config.interstitialEnabled) {
    return false;
  }
  if (
    !options?.ignoreCooldown &&
    !canShowByCooldown(lastInterstitialShownAt, config.interstitialCooldownMs)
  ) {
    return false;
  }
  if (!interstitial?.loaded) {
    loadInterstitial();
    return false;
  }

  try {
    await interstitial.show();
    lastInterstitialShownAt = Date.now();
    void persistCooldowns();
    interstitial = null;
    loadInterstitial();
    return true;
  } catch {
    interstitial = null;
    loadInterstitial();
    return false;
  }
}

/**
 * Uygunsa App Open gösterir (cold start / uzun arka plan dönüşü).
 * Cooldown cihazda saklanır — uygulamayı tamamen kapatsan da 30 dk dolmadan tekrar gelmez.
 */
export async function showAppOpenIfEligible(options?: {
  isPremium?: boolean;
  ignoreCooldown?: boolean;
}): Promise<boolean> {
  if (options?.isPremium || !isNativeAdsAvailable()) {
    return false;
  }
  await hydrateCooldowns();
  await hydrateAdsConfig();
  const config = getAdsConfig();
  if (!config.appOpenEnabled) {
    return false;
  }
  if (!options?.ignoreCooldown && !canShowByCooldown(lastAppOpenShownAt, config.appOpenCooldownMs)) {
    return false;
  }
  if (!appOpen?.loaded) {
    loadAppOpen();
    return false;
  }

  try {
    await appOpen.show();
    lastAppOpenShownAt = Date.now();
    void persistCooldowns();
    appOpen = null;
    loadAppOpen();
    return true;
  } catch {
    appOpen = null;
    loadAppOpen();
    return false;
  }
}

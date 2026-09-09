import { getAppOpenAdUnitId, getInterstitialAdUnitId, isNativeAdsAvailable } from '../constants/ads';

/** Tam ekran interstitial'lar arası minimum süre (AdMob önerisi: doğal kırılım + seyrek). */
const INTERSTITIAL_COOLDOWN_MS = 3 * 60 * 1000;

/** App Open reklamlar arası minimum süre (arka plandan dönüş / cold start). */
const APP_OPEN_COOLDOWN_MS = 4 * 60 * 60 * 1000;

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

/** AdMob init sonrası çağır — interstitial + app open ön yükleme. */
export function preloadFullscreenAds(): void {
  if (!isNativeAdsAvailable()) return;
  loadInterstitial();
  loadAppOpen();
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
  if (!options?.ignoreCooldown && !canShowByCooldown(lastInterstitialShownAt, INTERSTITIAL_COOLDOWN_MS)) {
    return false;
  }
  if (!interstitial?.loaded) {
    loadInterstitial();
    return false;
  }

  try {
    await interstitial.show();
    lastInterstitialShownAt = Date.now();
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
 */
export async function showAppOpenIfEligible(options?: {
  isPremium?: boolean;
  ignoreCooldown?: boolean;
}): Promise<boolean> {
  if (options?.isPremium || !isNativeAdsAvailable()) {
    return false;
  }
  if (!options?.ignoreCooldown && !canShowByCooldown(lastAppOpenShownAt, APP_OPEN_COOLDOWN_MS)) {
    return false;
  }
  if (!appOpen?.loaded) {
    loadAppOpen();
    return false;
  }

  try {
    await appOpen.show();
    lastAppOpenShownAt = Date.now();
    appOpen = null;
    loadAppOpen();
    return true;
  } catch {
    appOpen = null;
    loadAppOpen();
    return false;
  }
}

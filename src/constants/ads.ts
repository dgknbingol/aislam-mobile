import { Platform } from 'react-native';

import { isNativeModulesAvailable } from '../utils/nativeRuntime';

/** Google resmi test uygulama kimlikleri — geliştirme build'leri için */
export const ADMOB_TEST_APP_IDS = {
  android: 'ca-app-pub-3940256099942544~3347511713',
  ios: 'ca-app-pub-3940256099942544~1458002511',
} as const;

/** Google test unit ID'leri */
const TEST_ADAPTIVE_BANNER = 'ca-app-pub-3940256099942544/9214589741';
const TEST_INTERSTITIAL = 'ca-app-pub-3940256099942544/1033173712';
const TEST_APP_OPEN = 'ca-app-pub-3940256099942544/9257395921';
const TEST_REWARDED = 'ca-app-pub-3940256099942544/5224354917';

export function isNativeAdsAvailable(): boolean {
  return isNativeModulesAvailable();
}

/**
 * Mağaza derlemesinde bile test reklamı gösterir.
 * Kapalı test sürümünde açık tutulur; testçiler reklama tıklasa bile
 * AdMob "geçersiz trafik" ihlali oluşmaz.
 */
const forceTestAds = process.env.EXPO_PUBLIC_ADMOB_FORCE_TEST_ADS === 'true';

function useTestAdUnits(): boolean {
  return __DEV__ || forceTestAds;
}

/** Metro yalnızca statik `process.env.EXPO_PUBLIC_*` erişimini bundle'a gömer. */
function platformEnv(android?: string, ios?: string): string | undefined {
  const value = Platform.OS === 'ios' ? ios : android;
  return value?.trim() || undefined;
}

function resolveUnitId(testId: string, liveId?: string): string {
  if (useTestAdUnits()) {
    return testId;
  }
  return liveId || testId;
}

export function getBannerAdUnitId(): string {
  return resolveUnitId(
    TEST_ADAPTIVE_BANNER,
    platformEnv(
      process.env.EXPO_PUBLIC_ADMOB_BANNER_ANDROID,
      process.env.EXPO_PUBLIC_ADMOB_BANNER_IOS,
    ),
  );
}

export function getInterstitialAdUnitId(): string {
  return resolveUnitId(
    TEST_INTERSTITIAL,
    platformEnv(
      process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ANDROID,
      process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_IOS,
    ),
  );
}

export function getAppOpenAdUnitId(): string {
  return resolveUnitId(
    TEST_APP_OPEN,
    platformEnv(
      process.env.EXPO_PUBLIC_ADMOB_APP_OPEN_ANDROID,
      process.env.EXPO_PUBLIC_ADMOB_APP_OPEN_IOS,
    ),
  );
}

export function getRewardedAdUnitId(): string {
  return resolveUnitId(
    TEST_REWARDED,
    platformEnv(
      process.env.EXPO_PUBLIC_ADMOB_REWARDED_ANDROID,
      process.env.EXPO_PUBLIC_ADMOB_REWARDED_IOS,
    ),
  );
}

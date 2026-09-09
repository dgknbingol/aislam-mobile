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

function platformEnv(androidKey: string, iosKey: string): string | undefined {
  const value =
    Platform.OS === 'ios' ? process.env[iosKey]?.trim() : process.env[androidKey]?.trim();
  return value || undefined;
}

function resolveUnitId(testId: string, androidKey: string, iosKey: string): string {
  if (useTestAdUnits()) {
    return testId;
  }
  return platformEnv(androidKey, iosKey) ?? testId;
}

export function getBannerAdUnitId(): string {
  return resolveUnitId(
    TEST_ADAPTIVE_BANNER,
    'EXPO_PUBLIC_ADMOB_BANNER_ANDROID',
    'EXPO_PUBLIC_ADMOB_BANNER_IOS',
  );
}

export function getInterstitialAdUnitId(): string {
  return resolveUnitId(
    TEST_INTERSTITIAL,
    'EXPO_PUBLIC_ADMOB_INTERSTITIAL_ANDROID',
    'EXPO_PUBLIC_ADMOB_INTERSTITIAL_IOS',
  );
}

export function getAppOpenAdUnitId(): string {
  return resolveUnitId(
    TEST_APP_OPEN,
    'EXPO_PUBLIC_ADMOB_APP_OPEN_ANDROID',
    'EXPO_PUBLIC_ADMOB_APP_OPEN_IOS',
  );
}

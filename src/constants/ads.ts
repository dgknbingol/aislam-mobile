import { Platform } from 'react-native';

import { isNativeModulesAvailable } from '../utils/nativeRuntime';

/** Google resmi test uygulama kimlikleri — geliştirme build'leri için */
export const ADMOB_TEST_APP_IDS = {
  android: 'ca-app-pub-3940256099942544~3347511713',
  ios: 'ca-app-pub-3940256099942544~1458002511',
} as const;

/** Google test adaptive banner unit ID */
const TEST_ADAPTIVE_BANNER = 'ca-app-pub-3940256099942544/9214589741';

export function isNativeAdsAvailable(): boolean {
  return isNativeModulesAvailable();
}

function hasProductionBannerIds(): boolean {
  const ios = process.env.EXPO_PUBLIC_ADMOB_BANNER_IOS?.trim();
  const android = process.env.EXPO_PUBLIC_ADMOB_BANNER_ANDROID?.trim();
  return Platform.OS === 'ios' ? Boolean(ios) : Boolean(android);
}

export function getBannerAdUnitId(): string {
  if (__DEV__ || !hasProductionBannerIds()) {
    return TEST_ADAPTIVE_BANNER;
  }

  return Platform.OS === 'ios'
    ? process.env.EXPO_PUBLIC_ADMOB_BANNER_IOS!
    : process.env.EXPO_PUBLIC_ADMOB_BANNER_ANDROID!;
}

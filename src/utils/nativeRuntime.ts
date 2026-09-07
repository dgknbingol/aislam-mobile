import Constants from 'expo-constants';

/** Expo Go ile yüklendiğinde true — native modüller (AdMob, RevenueCat) yoktur. */
export function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

/** Dev client veya mağaza build'inde native modüller kullanılabilir. */
export function isNativeModulesAvailable(): boolean {
  return !isExpoGo();
}

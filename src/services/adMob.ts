import { isNativeModulesAvailable } from '../utils/nativeRuntime';

let initialized = false;

export async function initAdMob(): Promise<void> {
  if (initialized || !isNativeModulesAvailable()) {
    return;
  }

  try {
    const mobileAds = require('react-native-google-mobile-ads').default;
    await mobileAds().initialize();
    initialized = true;
  } catch {
    // Native modül yok — sessizce atla
  }
}

import { isNativeModulesAvailable } from '../utils/nativeRuntime';

let initialized = false;

/**
 * Bu cihazlar sürüm derlemesinde de gerçek reklam yerine test reklamı görür.
 * AdMob kendi reklamına tıklamayı "geçersiz trafik" sayıp hesabı kapatabildiği
 * için, sürüm derlemesini kendi telefonunda denerken cihaz kimliğini ekle.
 * Kimlik, ilk reklam isteğinde logcat'e "Use RequestConfiguration..." satırıyla yazılır.
 */
const testDeviceIds = (process.env.EXPO_PUBLIC_ADMOB_TEST_DEVICE_IDS ?? '')
  .split(',')
  .map((id: string) => id.trim())
  .filter(Boolean);

export async function initAdMob(): Promise<void> {
  if (initialized || !isNativeModulesAvailable()) {
    return;
  }

  try {
    const mobileAds = require('react-native-google-mobile-ads').default;
    if (testDeviceIds.length > 0) {
      await mobileAds().setRequestConfiguration({ testDeviceIdentifiers: testDeviceIds });
    }
    await mobileAds().initialize();
    initialized = true;
  } catch {
    // Native modül yok — sessizce atla
  }
}

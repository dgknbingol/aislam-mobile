import { Platform } from 'react-native';

import { PREMIUM_ENTITLEMENT_ID } from '../constants/subscription';
import { isNativeModulesAvailable } from '../utils/nativeRuntime';
import { ensureAppUserId } from './appUserStorage';

/** RevenueCat paket nesnesi — satın alma için tam nesne gerekir */
export type StorePackage = {
  product: {
    priceString: string | null;
  };
};

type PurchasesModule = typeof import('react-native-purchases');

const IOS_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ?? '';
const ANDROID_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY ?? '';

let configured = false;

function getApiKey(): string {
  return Platform.OS === 'ios' ? IOS_API_KEY : ANDROID_API_KEY;
}

function getPurchases(): PurchasesModule | null {
  if (!isNativeModulesAvailable()) {
    return null;
  }

  try {
    return require('react-native-purchases') as PurchasesModule;
  } catch {
    return null;
  }
}

export function isRevenueCatConfigured(): boolean {
  return isNativeModulesAvailable() && getApiKey().length > 0;
}

export async function configureRevenueCat(): Promise<void> {
  if (configured || !isRevenueCatConfigured()) return;

  const Purchases = getPurchases()?.default;
  if (!Purchases) return;

  const appUserId = await ensureAppUserId();
  Purchases.configure({
    apiKey: getApiKey(),
    appUserID: appUserId,
  });
  configured = true;
}

export async function getOfferings(): Promise<import('react-native-purchases').PurchasesOfferings | null> {
  if (!isRevenueCatConfigured()) return null;

  const Purchases = getPurchases()?.default;
  if (!Purchases) return null;

  await configureRevenueCat();
  return Purchases.getOfferings();
}

export async function purchasePackage(
  pkg: StorePackage,
): Promise<import('react-native-purchases').CustomerInfo> {
  const Purchases = getPurchases()?.default;
  if (!Purchases) {
    throw new Error('Satın alma yalnızca mağaza build\'inde kullanılabilir.');
  }

  await configureRevenueCat();
  const result = await Purchases.purchasePackage(
    pkg as import('react-native-purchases').PurchasesPackage,
  );
  return result.customerInfo;
}

export async function restorePurchases(): Promise<
  import('react-native-purchases').CustomerInfo
> {
  const Purchases = getPurchases()?.default;
  if (!Purchases) {
    throw new Error('Geri yükleme yalnızca mağaza build\'inde kullanılabilir.');
  }

  await configureRevenueCat();
  return Purchases.restorePurchases();
}

export async function getCustomerInfo(): Promise<
  import('react-native-purchases').CustomerInfo | null
> {
  if (!isRevenueCatConfigured()) return null;

  const Purchases = getPurchases()?.default;
  if (!Purchases) return null;

  await configureRevenueCat();
  return Purchases.getCustomerInfo();
}

export function hasPremiumEntitlement(
  info: import('react-native-purchases').CustomerInfo,
): boolean {
  return info.entitlements.active[PREMIUM_ENTITLEMENT_ID] != null;
}

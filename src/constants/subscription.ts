/**
 * Premium (abonelik) arayüzü açık mı?
 *
 * İlk Play sürümü reklamlı/ücretsiz çıkıyor; mağaza ürünleri ve RevenueCat
 * offering'i hazır olduğunda `true` yapıp yeni sürüm gönder.
 *
 * Kapalıyken: Ayarlar'daki Premium satırı, sohbet paywall'ı ve Premium linki gizlenir.
 * Backend'den gelen `quota.premium` yine de geçerlidir (satın almış kullanıcı korunur).
 */
export const PREMIUM_UI_ENABLED = false;

export const PREMIUM_ENTITLEMENT_ID = 'premium';

/** RevenueCat / mağaza ürün kimlikleri — dashboard ile eşleşmeli */
export const SUBSCRIPTION_PRODUCTS = {
  monthly: 'premium_monthly',
  yearly: 'premium_yearly',
} as const;

export const FREE_DAILY_CHAT_LIMIT = 3;
export const PREMIUM_DAILY_CHAT_LIMIT = 50;

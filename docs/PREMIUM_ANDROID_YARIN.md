# Premium Android — yarın kapanış (IBAN sonrası)

Bugün hazırlananlar: kod (`PREMIUM_UI_ENABLED`), ürün ID’leri, webhook endpoint, fiyat kararı.
**Bu dosya:** IBAN / Payments profile açılınca sırayla yapılacaklar.

## Sabitler (değiştirme)

| Alan | Değer |
|------|--------|
| Package | `net.eislam.app` |
| Aylık product ID | `premium_monthly` |
| Yıllık product ID | `premium_yearly` |
| Entitlement | `premium` |
| Aylık fiyat (TR) | ₺49,99 |
| Yıllık fiyat (TR) | ₺399,99 |
| Webhook URL | `https://api.e-islam.net/api/webhooks/revenuecat` |

## 1. Play satıcı

1. Play Console → **Payments profile / Satıcı hesabı** → IBAN + vergi → **Başla** / onay.
2. Abonelik oluşturma kilidi kalkana kadar bekle (bazen birkaç dakika).

## 2. Abonelik ürünleri

**Monetize with Play → Products → Subscriptions → Create subscription**

### premium_monthly
- Product ID: `premium_monthly`
- Name: `e-İslam Premium Aylık`
- Base plan: 1 month, fiyat **₺49,99**
- **Activate**

### premium_yearly
- Product ID: `premium_yearly`
- Name: `e-İslam Premium Yıllık`
- Base plan: 1 year, fiyat **₺399,99**
- **Activate**

## 3. License testing (bugün yapılmadıysa)

**Settings → License testing** → kendi Gmail + test Gmail’leri ekle.

## 4. RevenueCat

1. Android app `net.eislam.app` + Play service account JSON bağlı mı kontrol
2. **Product catalog → Import from Google Play** → `premium_monthly`, `premium_yearly`
3. Entitlement `premium` → iki ürüne attach
4. Offering `default` (Current):
   - Monthly paket → `premium_monthly`
   - Annual paket → `premium_yearly`
5. Public SDK key `goog_...` kopyala

## 5. Env

`aislam-mobile/.env` ve EAS **production** environment:

```env
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=goog_XXXXXXXX
```

EAS CLI:

```bash
cd aislam-mobile
npx eas-cli env:create --name EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY --value "goog_XXXXXXXX" --environment production --visibility plaintext
```

(veya dashboard → Project → Environment variables)

Webhook Authorization, backend `REVENUECAT_WEBHOOK_AUTH` ile **birebir aynı** olmalı (genelde `Bearer ...`).

## 6. Build + yükle

```bash
cd aislam-mobile
npx eas-cli build --platform android --profile closedtest --non-interactive
```

AAB’yi Play **kapalı test (Alpha)** track’ine yükle.

## 7. Smoke test

1. License tester Gmail ile uygulama aç
2. Ayarlar → Premium → aylık veya yıllık satın al (test ücreti)
3. Chat kotası 50 / reklamlar kapalı
4. DB: `app_users.premium = true` (webhook)
5. RevenueCat → Webhooks → Delivery: 200

## Kontrol listesi

```
[ ] Play satıcı / IBAN onaylı
[ ] premium_monthly Activate
[ ] premium_yearly Activate
[ ] License testing e-postaları
[ ] Play API service account → RevenueCat
[ ] RC products import + entitlement + offering
[ ] goog_ key → .env + EAS production
[ ] Webhook URL + Authorization eşleşiyor
[ ] closedtest AAB yüklendi
[ ] Test satın alma OK
```

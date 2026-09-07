# e-İslam — Yeni Apple / Google hesabı yayın checklist

Uygulama kimlikleri (**değiştirme** — kod ile birebir aynı olmalı):

| Platform | Kimlik |
|----------|--------|
| Android package | `net.eislam.app` |
| iOS bundle ID | `net.eislam.app` |
| Mağaza ürün ID | `premium_monthly`, `premium_yearly` |
| RevenueCat entitlement | `premium` |

Detaylı AdMob / RevenueCat adımları: `KURULUM_MONETIZASYON.md`, `MAGAZA_VE_ADMOB.md`.

---

## 0. Hazırlık

- [ ] Apple Developer Program aktif ($99/yıl)
- [ ] Google Play Console geliştirici hesabı aktif (tek seferlik ücret)
- [ ] [expo.dev](https://expo.dev) hesabı (build için)
- [ ] Privacy Policy URL hazır (web sayfası; mağaza formu ister)
- [ ] Prod API ayakta: örn. `https://api.e-islam.net`

---

## 1. Expo / EAS (yeni hesabın)

```bash
cd aislam-mobile
npx eas-cli login
npx eas-cli whoami
```

- [ ] Doğru Expo hesabındasın
- [ ] Proje bağlı: `npx eas-cli init` (gerekirse yeni project; `app.config.ts` → `extra.eas.projectId` güncellenir)

**Android imza (yeni Play hesabı):**

```bash
npx eas-cli credentials -p android
```

- [ ] Keystore’u **EAS’ta oluştur** (remote) — eski hesaba ait local keystore kullanma
- [ ] `eas.json` içinde `credentialsSource: "local"` varsa yeni hesapta **remote**’a geç veya credentials’ı yeniden üret

---

## 2. Google Play Console

1. [play.google.com/console](https://play.google.com/console) → **Create app**
2. Ad: **e-İslam** · Package: **`net.eislam.app`** (manuel oluşturuyorsan bu ID)
3. Store listing (kısa/uzun açıklama, ikon 512, feature graphic, ekran görüntüleri)
4. Privacy policy URL
5. Content rating, hedef kitle, veri güvenliği formu

### Abonelik (Premium)

- [ ] `premium_monthly` (1 ay)
- [ ] `premium_yearly` (1 yıl)
- [ ] Activate
- [ ] **License testing** → kendi Gmail’in

### API erişimi (RevenueCat için)

- [ ] Setup → API access → service account JSON → RevenueCat’e yükle

---

## 3. Apple / App Store Connect

1. [developer.apple.com](https://developer.apple.com) → **Identifiers** → App ID: **`net.eislam.app`**
   - Capabilities: Push Notifications (bildirim kullanıyorsan), In-App Purchase
2. [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → **New App**
   - Bundle ID: `net.eislam.app`
   - SKU: `e-islam-mobile`
3. Store bilgileri, ekran görüntüleri, privacy URL, App Privacy formu

### Abonelik

- [ ] Subscription Group: `e-İslam Premium`
- [ ] `premium_monthly` / `premium_yearly`
- [ ] Paid Apps Agreement + banka / vergi bilgileri tamam

### EAS ↔ Apple

```bash
npx eas-cli credentials -p ios
```

- [ ] EAS’in Apple hesabınla certificate / provisioning oluşturmasına izin ver (önerilen)

---

## 4. AdMob (yeni Google hesabı)

[admob.google.com](https://admob.google.com) → Apps → Add app

| Platform | Package / Bundle |
|----------|------------------|
| Android | `net.eislam.app` |
| iOS | `net.eislam.app` |

- [ ] App ID’leri al
- [ ] Banner ad unit’leri oluştur
- [ ] `aislam-mobile/.env` doldur:

```env
EXPO_PUBLIC_ADMOB_ANDROID_APP_ID=ca-app-pub-xxxx~xxxx
EXPO_PUBLIC_ADMOB_IOS_APP_ID=ca-app-pub-xxxx~xxxx
EXPO_PUBLIC_ADMOB_BANNER_ANDROID=ca-app-pub-xxxx/xxxx
EXPO_PUBLIC_ADMOB_BANNER_IOS=ca-app-pub-xxxx/xxxx
```

Store build’de **test App ID bırakma**.

---

## 5. RevenueCat

1. [app.revenuecat.com](https://app.revenuecat.com) → proje
2. Apps: iOS + Android → bundle/package = `net.eislam.app`
3. Play service account JSON + App Store Connect API key / shared secret
4. Products: `premium_monthly`, `premium_yearly`
5. Entitlement: `premium` → ürünlere bağla
6. Public API keys → `.env`:

```env
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_...
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=goog_...
EXPO_PUBLIC_RAG_API_URL=https://api.e-islam.net
```

7. Webhook → backend URL + `REVENUECAT_WEBHOOK_AUTH` (sunucu `.env`)

---

## 6. Build & yükleme

### Önce internal test (önerilen)

```bash
# Android APK (iç test)
npx eas-cli build --profile preview --platform android

# iOS (TestFlight için production profili veya preview)
npx eas-cli build --profile production --platform ios
```

- [ ] Android APK’yı telefona yükle / Play **Internal testing** track
- [ ] iOS → `eas submit -p ios` veya Transporter → TestFlight

### Mağaza production

```bash
npx eas-cli build --profile production --platform android
npx eas-cli build --profile production --platform ios

npx eas-cli submit --profile production --platform android
npx eas-cli submit --profile production --platform ios
```

- [ ] Play: Production (veya staged rollout)
- [ ] App Store: Review’a gönder

---

## 7. Son kontrol (submit öncesi)

- [ ] `.env` prod API + gerçek AdMob + gerçek RevenueCat
- [ ] Bildirim sesleri için bu native build alındı
- [ ] Konum / bildirim izin metinleri doğru
- [ ] Premium satın alma sandbox / license test ile denendi
- [ ] Reklam test cihazda görünüyor (prod ID ile dikkatli test)
- [ ] Privacy policy erişilebilir
- [ ] `version` / `versionCode` (EAS `autoIncrement` production’da açık)

---

## Sıra özeti

```
Expo login → EAS project
    ↓
Play Console app + abonelikler
    ↓
App Store Connect app + abonelikler
    ↓
AdMob app + banner → .env
    ↓
RevenueCat bağla → .env + webhook
    ↓
eas build (preview) → iç test
    ↓
eas build (production) → eas submit → inceleme
```

Takıldığın adımı yaz; birlikte netleştiririz.

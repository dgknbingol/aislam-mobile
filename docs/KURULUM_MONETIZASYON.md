# e-İslam — Monetizasyon Kurulum Rehberi

Bu rehber **EAS development build**, **RevenueCat (Premium)** ve **AdMob (reklam)** kurulumunu sırayla anlatır.

**Uygulama kimlikleri (değiştirmeyin — kod ile eşleşmeli):**

| Platform | Kimlik |
|----------|--------|
| Android package | `com.eislam` |
| iOS bundle ID | `com.eislam` |
| RevenueCat entitlement | `premium` |
| Mağaza ürün ID | `premium_monthly`, `premium_yearly` |

---

## Bölüm A — EAS Development Build

AdMob ve RevenueCat **Expo Go'da çalışmaz**. Önce development client build alın.

### A1. Expo hesabı

```bash
cd aislam-mobile
npx eas-cli login
```

Tarayıcıda Expo hesabınızla giriş yapın (yoksa [expo.dev](https://expo.dev) üzerinden ücretsiz oluşturun).

### A2. EAS projesini bağla

```bash
npx eas-cli init
```

- "Create a new project" seçin
- `app.config.ts` içine `extra.eas.projectId` otomatik eklenir

### A3. Android development build

```bash
npx eas-cli build --profile development --platform android
```

- İlk seferde keystore oluşturmayı EAS'a bırakın (önerilen)
- Build ~15–25 dk sürer
- Bitince QR / APK linki gelir → telefona yükleyin

### A4. iOS development build (Mac + Apple Developer hesabı gerekir)

```bash
npx eas-cli build --profile development --platform ios
```

Cihaza yüklemek için Apple Developer Program ($99/yıl) gerekir.

### A5. Geliştirme sunucusunu başlat

Build yüklendikten sonra (Expo Go değil, yüklediğiniz dev client uygulamasını açın):

```bash
npm run start:dev-client
```

---

## Bölüm B — Google Play Console (Android abonelik)

### B1. Uygulama oluştur

1. [play.google.com/console](https://play.google.com/console)
2. **Create app** → ad: **e-İslam**, package: **`com.eislam`**
3. Store listing ve politika formlarını ilerleyin (test için draft yeterli)

### B2. Abonelik ürünleri

1. **Monetize → Products → Subscriptions**
2. **Create subscription** — iki kez:

| Alan | Aylık | Yıllık |
|------|-------|--------|
| Product ID | `premium_monthly` | `premium_yearly` |
| Name | e-İslam Premium Aylık | e-İslam Premium Yıllık |
| Billing period | 1 month | 1 year |

3. Base plan fiyatlandırması ekleyin (ör. ₺49,99 / ₺399,99)
4. **Activate** edin

### B3. Test lisansı

**Settings → License testing** → kendi Gmail adresinizi test kullanıcısı olarak ekleyin.

### B4. Play Console → RevenueCat bağlantısı

RevenueCat dashboard'da (Bölüm C) Android app eklerken **Service credentials JSON** gerekir:

1. Play Console → **Setup → API access**
2. Google Cloud projesini bağlayın
3. **Service account** oluşturun → JSON indirin
4. Bu JSON'u RevenueCat → Android app → **Google Play** bölümüne yükleyin

---

## C — App Store Connect (iOS abonelik)

### C1. App kaydı

1. [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. **My Apps → +** → **New App**
3. Bundle ID: **`com.eislam`** (Certificates, Identifiers'ta önce oluşturun)
4. SKU: `e-islam-mobile`

### C2. Subscription Group

1. Uygulama → **Subscriptions**
2. **Subscription Group** oluştur: `e-İslam Premium`
3. İki abonelik ekleyin:

| Reference Name | Product ID | Süre |
|----------------|------------|------|
| Premium Monthly | `premium_monthly` | 1 Month |
| Premium Yearly | `premium_yearly` | 1 Year |

4. Fiyatlandırma ve yerelleştirme (Türkçe açıklama) ekleyin
5. **Ready to Submit** durumuna getirin

### C3. Sandbox test

iPhone → **Settings → App Store → Sandbox Account** → test Apple ID oluşturun.

### C4. App Store Connect → RevenueCat

RevenueCat iOS app eklerken **App-Specific Shared Secret** veya **In-App Purchase Key** (.p8) gerekir:

- App Store Connect → **Users and Access → Integrations → In-App Purchase**
- Key oluştur → RevenueCat iOS app ayarlarına yapıştırın

---

## D — RevenueCat Dashboard

### D1. Proje

1. [app.revenuecat.com](https://app.revenuecat.com) → **+ New Project** → `e-İslam`

### D2. Uygulamalar

**Apps → + New**

**iOS app:**
- App name: `e-İslam iOS`
- Bundle ID: `com.eislam`
- App Store Connect API key / shared secret ekleyin

**Android app:**
- App name: `e-İslam Android`
- Package name: `com.eislam`
- Google Play service account JSON yükleyin

### D3. Products (Mağaza ürünlerini içe aktar)

**Product catalog → Products → + New**

| Identifier | Store |
|------------|-------|
| `premium_monthly` | App Store + Google Play |
| `premium_yearly` | App Store + Google Play |

Her ürün için **Import from store** ile mağazadaki ürünü eşleştirin.

### D4. Entitlement

**Entitlements → + New**

- Identifier: **`premium`** (kodda aynı)
- Attach products: `premium_monthly` + `premium_yearly`

### D5. Offering

**Offerings → default (veya yeni offering)**

- **Monthly** paket → `premium_monthly` ürünü
- **Annual** paket → `premium_yearly` ürünü
- **Current offering** olarak işaretleyin

Mobil uygulama `offerings.current.monthly` ve `offerings.current.annual` paketlerini kullanır.

### D6. API Keys → Mobil `.env`

**Project Settings → API keys → Public app-specific keys**

`aislam-mobile/.env`:

```env
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_xxxxxxxx
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=goog_xxxxxxxx
```

`.env` değiştirdikten sonra dev client'ı yeniden başlatın.

### D7. Webhook → Backend

**Project → Integrations → Webhooks → + New**

| Alan | Değer |
|------|-------|
| URL | `https://<SUNUCU_IP_VEYA_DOMAIN>/api/webhooks/revenuecat` |
| Authorization header | Güçlü rastgele bir secret (ör. `Bearer rc_wh_abc123...`) |

`rag-api-server/.env`:

```env
REVENUECAT_WEBHOOK_AUTH=Bearer rc_wh_abc123...
```

**Önemli:** Backend'deki değer, RevenueCat'te yazdığınız Authorization header ile **birebir aynı** olmalı.

Webhook event'leri: `INITIAL_PURCHASE`, `RENEWAL`, `CANCELLATION`, `EXPIRATION` — backend `app_users.premium` günceller.

### D8. Test satın alma

1. Dev client'ta **Ayarlar → Premium**
2. Sandbox / test hesabı ile satın al
3. Birkaç saniye içinde webhook gelir → kota 50/gün olur, reklamlar kaybolur

Webhook gelmezse:
- Backend loglarında `RevenueCat webhook` satırına bakın
- RevenueCat → Webhooks → **Delivery** sekmesinde hata kodunu kontrol edin
- Firewall'da 8080/port açık mı?

---

## E — AdMob

### E1. Uygulamalar

[admob.google.com](https://admob.google.com) → **Apps → Add app**

| Platform | AdMob app name | Package / Bundle |
|----------|----------------|------------------|
| Android | e-İslam | `com.eislam` |
| iOS | e-İslam | `com.eislam` |

Her biri için **App ID** alın (`ca-app-pub-XXXX~YYYY` formatında).

### E2. Banner reklam birimi

Her uygulama için **Ad units → Banner**:

- Ad unit name: `Chat Banner`
- Unit ID: `ca-app-pub-XXXX/ZZZZ`

### E3. Mobil `.env`

```env
EXPO_PUBLIC_ADMOB_ANDROID_APP_ID=ca-app-pub-xxxxxxxx~xxxxxxxx
EXPO_PUBLIC_ADMOB_IOS_APP_ID=ca-app-pub-xxxxxxxx~xxxxxxxx
EXPO_PUBLIC_ADMOB_BANNER_ANDROID=ca-app-pub-xxxxxxxx/xxxxxxxx
EXPO_PUBLIC_ADMOB_BANNER_IOS=ca-app-pub-xxxxxxxx/xxxxxxxx
```

App ID değiştiyse **yeni EAS build** gerekir (native config). Banner unit ID sadece JS tarafında — restart yeterli.

### E4. Play Console

**Policy → App content → Ads** → **Yes, contains ads**

### E5. Test

- Ücretsiz kullanıcı → Chat ekranı altında banner
- Premium → banner yok
- Geliştirmede `.env` banner boşsa Google test reklamı gösterilir

---

## F — Kontrol listesi

```
[ ] eas login + eas init
[ ] Android dev build yüklendi
[ ] Play: premium_monthly + premium_yearly aktif
[ ] App Store: aynı product ID'ler
[ ] RevenueCat: apps, products, entitlement premium, offering current
[ ] .env RevenueCat API keys
[ ] Webhook URL + REVENUECAT_WEBHOOK_AUTH
[ ] AdMob app + banner unit ID'leri
[ ] npm run start:dev-client ile test
[ ] Sandbox satın alma → premium aktif
[ ] Chat kotası 3 → 50
[ ] Reklam premium'da kapalı
```

---

## Sık sorunlar

| Sorun | Çözüm |
|-------|--------|
| Premium ekranında fiyat "—" | Offering/current paket tanımlı değil veya RC key yanlış |
| Satın alma oluyor ama premium yok | Webhook URL/auth hatalı; backend loglarına bakın |
| `Package does not contain valid config plugin` | `npx expo prebuild --clean` + yeni build |
| Expo Go'da crash | Normal — dev client kullanın |
| Chat 429 quota | Günlük limit doldu; yarın sıfırlanır (Europe/Istanbul) |

---

## Hızlı komutlar

```bash
# Giriş + proje
npx eas-cli login
npx eas-cli init

# Build
npx eas-cli build --profile development --platform android
npx eas-cli build --profile development --platform ios

# Geliştirme
npm run start:dev-client
```

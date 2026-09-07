# e-İslam Mobile

Expo (React Native) istemci uygulaması. RAG cevapları için **rag-api-server** Spring Boot servisine HTTP ile bağlanır.

## Gereksinimler

- Node.js 20+
- npm
- [rag-api-server](../rag-api-server) çalışır durumda (port 8080)
- LM Studio + Qdrant (RAG API tarafında)
- **Reklam / satın alma:** Expo Go yeterli değil — `expo-dev-client` ile native build gerekir

## Kurulum

```bash
npm install
cp .env.example .env
# .env içinde EXPO_PUBLIC_RAG_API_URL değerini güncelleyin
npm start
```

Native modüller (AdMob, RevenueCat) için development build:

> **Detaylı adım adım rehber:** [docs/KURULUM_MONETIZASYON.md](./docs/KURULUM_MONETIZASYON.md)

```bash
npx eas-cli login
npx eas-cli init
npx eas-cli build --profile development --platform android
```

Build sonrası:

```bash
npm run start:dev-client
```

## API bağlantısı

| Ortam | `EXPO_PUBLIC_RAG_API_URL` |
|--------|---------------------------|
| Android emülatör | `http://10.0.2.2:8080` |
| Fiziksel telefon (aynı Wi-Fi) | `http://<PC_IP>:8080` |
| iOS simülatör | `http://localhost:8080` |

Endpoint: `POST /api/chat/ask` — header: `X-App-User-Id` (anonim UUID), gövde: `{ "question": "..." }`

`.env` değiştirdikten sonra Expo'yu yeniden başlatın.

---

## Premium & RevenueCat kurulumu

### 1. App Store Connect & Google Play Console

| Ürün | Product ID | Tip |
|------|------------|-----|
| Aylık | `premium_monthly` | Auto-renewable subscription |
| Yıllık | `premium_yearly` | Auto-renewable subscription |

Her iki mağazada da abonelik grubu oluşturun ve fiyatlandırın.

### 2. RevenueCat dashboard

1. [app.revenuecat.com](https://app.revenuecat.com) → yeni proje
2. **Apps** → iOS + Android uygulamalarını bağlayın (bundle ID / package name eşleşmeli)
3. **Products** → `premium_monthly`, `premium_yearly` mağaza ürünlerini import edin
4. **Entitlements** → `premium` oluşturun, her iki ürünü bağlayın
5. **Offerings** → default offering'e monthly + annual paketleri ekleyin
6. **Project → API keys** → Public SDK keys → `.env` dosyasına yapıştırın:
   - `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`
   - `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`
7. **Integrations → Webhooks** → URL:
   ```
   https://<API_SUNUCU>/api/webhooks/revenuecat
   ```
   Authorization header değerini backend `.env` içine `REVENUECAT_WEBHOOK_AUTH` olarak yazın.

### 3. Backend

`rag-api-server/.env`:

```env
REVENUECAT_WEBHOOK_AUTH=<RevenueCat webhook Authorization secret>
```

Webhook geldiğinde `app_users.premium` güncellenir; mobil kotası otomatik 50/gün olur.

### 4. Test

- RevenueCat **Sandbox** kullanıcısı ile satın alma (iOS Settings → Sandbox Account)
- Satın alma sonrası **Ayarlar → Premium** ekranında premium aktif görünmeli
- Chat kotası 50'ye çıkmalı, reklamlar kaybolmalı

---

## AdMob kurulumu

### 1. AdMob console

1. [admob.google.com](https://admob.google.com) → uygulama ekle (Android + iOS)
2. **App ID**'leri `.env` dosyasına:
   - `EXPO_PUBLIC_ADMOB_ANDROID_APP_ID`
   - `EXPO_PUBLIC_ADMOB_IOS_APP_ID`
3. **Banner** reklam birimi oluştur → unit ID'leri:
   - `EXPO_PUBLIC_ADMOB_BANNER_ANDROID`
   - `EXPO_PUBLIC_ADMOB_BANNER_IOS`

### 2. Mağaza bildirimi

Google Play Console → **App content** → "Contains ads" → **Yes**

### 3. Davranış

- Ücretsiz kullanıcı: Chat ekranı altında banner (Expo Go'da reklam yok)
- Premium: reklam gizlenir
- `.env` banner ID boşsa geliştirmede Google test reklamları kullanılır

---

## Freemium özeti

| Özellik | Ücretsiz | Premium |
|---------|----------|---------|
| Kur'an, ezan, kıble, tesbih | ✓ | ✓ |
| Chat | 3 soru/gün (giriş yok) | 50 soru/gün |
| Reklam | Var | Yok |

## Proje yapısı

```
src/
  constants/ads.ts, subscription.ts
  services/adMob.ts, revenueCat.ts, chatApi.ts, appUserStorage.ts
  context/SubscriptionContext.tsx, ChatContext.tsx
  components/ads/AdBanner.tsx
  screens/settings/PremiumSettingsScreen.tsx
```

## İlgili repo

Backend: [../rag-api-server](../rag-api-server)

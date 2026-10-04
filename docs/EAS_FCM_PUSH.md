# Doğrudan FCM + APNs (Expo Push yok)

**Ezan, günlük içerik ve yarışma** bildirimleri internet varken sunucudan **FCM/APNs** ile gider. Offline iken yalnızca sonraki **1–2 ezan** yerel yedek planlanır. Expo Push servisi kullanılmaz.

## 1) Firebase (Android — öncelik)

1. [Firebase Console](https://console.firebase.google.com/) → proje → Android app: `net.eislam.app`
2. `google-services.json` indir → `aislam-mobile/google-services.json` (gitignore’da)
3. Project settings → Service accounts → **Generate new private key**
4. JSON içeriğini sunucu secret’ına koy:
   - Env: `FIREBASE_CREDENTIALS_JSON` (tüm JSON metni; satır sonları `\n` olabilir)
5. Yeni Android native build:
   ```bash
   cd aislam-mobile
   npm run build:preview:android
   ```

## 2) APNs (iOS)

1. Apple Developer → Keys → APNs key (`.p8`) oluştur
2. Sunucu env:
   - `APNS_KEY_PEM` — `.p8` dosya içeriği
   - `APNS_KEY_ID`
   - `APNS_TEAM_ID`
   - `APNS_BUNDLE_ID=net.eislam.app`
   - `APNS_PRODUCTION=true` (TestFlight/App Store)

## 3) Backend

`app.push.enabled: true` ve credential’lar dolu olmalı. Scheduler ~5 sn’de bir bakar; **erken göndermez** (`lookahead=0`), vakit geldikten sonra en fazla birkaç sn içinde **500’lük FCM batch** ile gönderir.

k8s secret örneği: `rag-api-server/deploy/k8s/secret.example.yaml`

## 4) Mobil

- Token: `Notifications.getDevicePushTokenAsync()` (FCM / APNs)
- Kayıt: `POST /api/notifications/register` body: `pushToken`, `platform`, konum, prefs
- Ayarlar → **Sunucu ezan push testi**

Expo Go’da native FCM token güvenilir değildir; **dev client / store APK** kullanın.

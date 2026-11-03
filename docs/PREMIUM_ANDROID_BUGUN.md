# Premium Android — bugün (IBAN yok)

Play abonelik **Activate** IBAN/Payments profile ister → yarına.
Bugün yapılacaklar (panel + sunucu).

## A. Play Console (giriş gerekir)

### A1. License testing
1. [play.google.com/console](https://play.google.com/console) → uygulama **e-İslam**
2. **Settings → License testing**
3. Ekle: kendi Gmail + kapalı test Gmail’leri
4. Kaydet

### A2. API access (RevenueCat)
1. Play Console → **Setup → API access** (veya Users and permissions → API access)
2. Google Cloud projesini bağla
3. Service account oluştur / seç
4. İzinler (RevenueCat önerisi):
   - View financial data / View financial reports
   - Manage orders and subscriptions
5. JSON key indir → **repoya koyma**, sadece RC’ye yükle

Doğrudan abonelik Create denenebilir; Activate çoğu zaman satıcı onayı ister → takılırsa bırak, yarın.

## EAS production env

`eas env:list --environment production` → şu an **boş**.  
`goog_...` alınca:

```bash
cd aislam-mobile
npx eas-cli env:create --name EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY --value "goog_XXX" --environment production --visibility plaintext
```

Ayrıca `aislam-mobile/.env` içine aynı key.

## B. RevenueCat

1. [app.revenuecat.com](https://app.revenuecat.com) → proje `e-İslam`
2. **Apps → Android**
   - Package: `net.eislam.app`
   - Google Play credentials: A2 JSON
3. **Entitlements →** identifier `premium` (yoksa oluştur)
4. **Offerings →** `default` Current:
   - Monthly → product id `premium_monthly` (Play’de yoksa yarın import)
   - Annual → `premium_yearly`
5. **Integrations → Webhooks → +**
   - URL: `https://api.e-islam.net/api/webhooks/revenuecat`
   - Authorization header: `rag-api-server/.env` içindeki `REVENUECAT_WEBHOOK_AUTH` ile **aynı** (ör. `Bearer …`)
6. **API keys** → Android public key `goog_...` kopyala → `aislam-mobile/.env` + EAS production

### Webhook sunucu eşlemesi — DONE (2026-11-03)

- Secret eski/yanlış değerden temizlendi; `rag-api-server/.env` ile pod SHA eşleşiyor.
- ClusterIP + `https://api.e-islam.net` → **HTTP 200** (doğru Authorization).
- Yeniden sync: `deploy/k8s/rebuild-secret-from-env.py`
- Windows doğrulama: `python deploy/k8s/test-webhook-windows.py`

RevenueCat dashboard webhook:

| Alan | Değer |
|------|--------|
| URL | `https://api.e-islam.net/api/webhooks/revenuecat` |
| Authorization | `rag-api-server/.env` → `REVENUECAT_WEBHOOK_AUTH` (birebir, `Bearer …`) |

## C. Fiyat kilidi (yarın Create)

- Aylık: **₺49,99** → `premium_monthly`
- Yıllık: **₺399,99** → `premium_yearly`

## D. Yarın

→ [`PREMIUM_ANDROID_YARIN.md`](PREMIUM_ANDROID_YARIN.md)

# Ezan push QA (FCM / APNs)

## Önkoşul

- Backend’de `FIREBASE_CREDENTIALS_JSON` (Android) — iOS için `APNS_*`
- `google-services.json` ile alınmış native Android build
- Bildirim izni açık; Samsung’da pil kısıtlaması kapalı önerilir

## Senaryolar

| # | Senaryo | Beklenen |
|---|---------|----------|
| 1 | Uygulama aç → izin → konum | `POST /api/notifications/register` 200; `push_token` dolu |
| 2 | Ayarlar → **Sunucu ezan push testi** | FCM/APNs bildirimi; tap → ana sayfa |
| 3 | Uygulama kapalı + vakit ±1 dk | Sunucu push |
| 4 | Doze / uzun süre kullanılmamış | Push gelir |
| 5 | İnternet yok (app sync anında) | Sonraki 1–2 ezan yerel yedek planlanır |
| 6 | Vakit prefs kapalı | Push yok |
| 7 | İzin reddedildi | `enabled=false` |

## Log

```bash
kubectl -n eislam logs deploy/rag-api --tail=100 | grep -i 'Prayer push\|Native push\|FCM\|APNs'
```

Geçersiz token → `UNREGISTERED` / `BadDeviceToken` → cihaz `enabled=false`.

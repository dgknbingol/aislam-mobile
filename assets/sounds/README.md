# Bildirim sesleri

Bu klasördeki dosyalar yerel bildirimlerde çalınır (`expo-notifications`).

## Dosya adları (değiştirme)

| Dosya | Ayarlarda görünen ad |
| --- | --- |
| `ezan.wav` | Ezan |
| `melody_1.wav` | Melodi 1 |
| `melody_2.wav` | Melodi 2 |
| `melody_3.wav` | Melodi 3 |
| `notification1.mp3` | Bildirim 1 |
| `notification2.mp3` | Bildirim 2 |
| `notification3.mp3` | Bildirim 3 |
| `notification4.mp3` | Bildirim 4 |
| `notification5.mp3` | Bildirim 5 |
| `notification6.mp3` | Bildirim 6 |
| `notification7.mp3` | Bildirim 7 |

## Öneriler

- Format: **WAV** (Expo / iOS için en sorunsuz) veya **MP3** (Android iyi; iOS bildirimde destek sınırlı olabilir)
- Süre: tercihen **≤ 30 sn** (iOS bildirim limiti)
- Ezan için kısa bir kesit kullan; tam ezan bildirim sesi olarak uygun değil
- Değişiklikten sonra **yeni native build** (EAS) gerekir
- Android’de ses dosyasını / kanal listesini değiştirirsen `SOUND_CHANNEL_VERSION` değerini `src/constants/notificationSounds.ts` içinde artır

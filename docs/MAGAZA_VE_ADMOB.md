# e-İslam — AdMob & Mağaza Listeleme Metinleri

Onay beklerken hazırlayın; Play / App Store formlarına doğrudan yapıştırın.

**Sabit bilgiler**

| Alan | Değer |
|------|-------|
| Uygulama adı | e-İslam |
| Android package | `net.eislam.app` |
| iOS bundle ID | `net.eislam.app` |
| Gizlilik | https://e-islam.net/gizlilik |
| Koşullar | https://e-islam.net/kosullar |
| İletişim | info@e-islam.net |
| Kategori | Yaşam Tarzı / Lifestyle |
| Reklam | Evet (ücretsiz planda banner) |
| Uygulama içi satın alma | Evet (Premium abonelik) |

---

## Bölüm 1 — AdMob (admob.google.com)

### Adım 1: Hesap

1. [admob.google.com](https://admob.google.com) → Google hesabınla giriş
2. Ülke, para birimi (TRY), kabul et

### Adım 2: Android uygulaması ekle

1. **Uygulamalar → Uygulama ekle**
2. Platform: **Android**
3. Uygulama mağazada mı? → **Hayır** (henüz yayında değil)
4. Uygulama adı: **e-İslam**
5. Ekle

**App ID** şuna benzer: `ca-app-pub-XXXXXXXX~XXXXXXXX`  
→ `.env` dosyasına:

```env
EXPO_PUBLIC_ADMOB_ANDROID_APP_ID=ca-app-pub-XXXXXXXX~XXXXXXXX
```

### Adım 3: Android banner birimi

1. Uygulamayı seç → **Reklam birimleri → Reklam birimi ekle**
2. Biçim: **Banner**
3. Ad: `chat_banner_android`
4. Ekle

**Banner unit ID** şuna benzer: `ca-app-pub-XXXXXXXX/XXXXXXXX`  
→ `.env`:

```env
EXPO_PUBLIC_ADMOB_BANNER_ANDROID=ca-app-pub-XXXXXXXX/XXXXXXXX
```

### Adım 4: iOS (Apple onayı gelince aynı adımlar)

1. **Uygulama ekle** → iOS → mağazada değil
2. App ID → `EXPO_PUBLIC_ADMOB_IOS_APP_ID`
3. Banner birimi → `EXPO_PUBLIC_ADMOB_BANNER_IOS`

### Adım 5: `.env` örneği (tam)

```env
EXPO_PUBLIC_RAG_API_URL=https://api.e-islam.net
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=test_xxxx
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=

EXPO_PUBLIC_ADMOB_ANDROID_APP_ID=ca-app-pub-XXXX~XXXX
EXPO_PUBLIC_ADMOB_IOS_APP_ID=ca-app-pub-XXXX~XXXX
EXPO_PUBLIC_ADMOB_BANNER_ANDROID=ca-app-pub-XXXX/XXXX
EXPO_PUBLIC_ADMOB_BANNER_IOS=ca-app-pub-XXXX/XXXX
```

`.env` değiştirdikten sonra **yeni EAS build** gerekir (AdMob native yapılandırması build’e gömülür).

### Adım 6: Play Console bildirimi

Play Console → **Uygulama içeriği → Reklamlar** → **Evet, uygulama reklam içerir**

---

## Bölüm 2 — Google Play Store metinleri

### Kısa açıklama (max 80 karakter)

```
İslami yaşam rehberiniz: Kuran, ezan, kıble, AI sohbet ve daha fazlası.
```

(78 karakter)

### Tam açıklama

```
e-İslam, günlük ibadet ve İslami yaşamınızı kolaylaştıran kapsamlı bir mobil rehberdir.

📖 KUR'AN-I KERİM
Ayetleri okuyun, meal ile takip edin ve dinleyin.

🕌 EZAN VAKİTLERİ
Bulunduğunuz konuma veya seçtiğiniz şehre göre günlük namaz vakitlerini görün. İsteğe bağlı ezan bildirimleri ile vakitleri kaçırmayın.

🧭 KIBLE PUSULASI
Konumunuza göre Kâbe yönünü kolayca bulun.

📿 TESBİH
Dijital tesbih ile zikirlerinizi takip edin.

💬 AI SOHBET
İslami konularda yapay zekâ destekli soru-cevap. Kayıt olmadan günde 3 ücretsiz soru hakkı. Premium ile günde 50 soru ve reklamsız deneyim.

🏆 BİLGİ YARIŞMASI
Dini bilgi quizlerine katılın, puan toplayın ve liderlik tablosunda yerinizi görün.

⭐ e-İSLAM PREMIUM
• Günde 50 AI sohbet hakkı
• Reklamsız kullanım
• Aylık veya yıllık abonelik seçenekleri

e-İslam, fetva veya resmi dini hüküm vermez. Önemli konularda yetkili alimlere danışmanızı öneririz.

Gizlilik: https://e-islam.net/gizlilik
İletişim: info@e-islam.net
```

### Ne yenilik var? (İlk sürüm)

```
e-İslam'ın ilk sürümü yayında! Kuran, ezan vakitleri, kıble pusulası, tesbih, AI sohbet ve bilgi yarışması tek uygulamada.
```

### Etiketler / anahtar kelimeler (Play — virgülle)

```
islam, kuran, ezan, namaz, kıble, tesbih, dini, müslüman, ibadet, ramazan
```

---

## Bölüm 3 — App Store Connect metinleri

### Alt başlık (max 30 karakter)

```
Kuran, ezan ve AI rehber
```

(24 karakter)

### Tanıtım metni (max 170 karakter, güncellenebilir)

```
Kuran okuyun, ezan vakitlerini takip edin, kıbleyi bulun. AI ile İslami sorularınıza cevap alın. Premium ile reklamsız ve daha fazla sohbet hakkı.
```

### Açıklama

```
e-İslam, günlük ibadet ve İslami yaşamınızı kolaylaştıran kapsamlı bir mobil rehberdir.

KUR'AN-I KERİM
Ayetleri okuyun, meal ile takip edin ve dinleyin.

EZAN VAKİTLERİ
Konumunuza göre namaz vakitlerini görün. İsteğe bağlı bildirimlerle vakitleri kaçırmayın.

KIBLE PUSULASI
Kâbe yönünü kolayca bulun.

TESBİH
Dijital tesbih ile zikirlerinizi takip edin.

AI SOHBET
İslami konularda yapay zekâ destekli soru-cevap. Günde 3 ücretsiz soru. Premium: günde 50 soru, reklamsız.

BİLGİ YARIŞMASI
Quizlere katılın, puan toplayın, liderlik tablosunda yarışın.

e-İSLAM PREMIUM
Abonelik ile günlük 50 AI sohbet hakkı ve reklamsız kullanım. Aylık veya yıllık plan.

Önemli: Uygulama fetva veya resmi dini hüküm vermez. Önemli konularda yetkili alimlere danışın.

Gizlilik Politikası: https://e-islam.net/gizlilik
Kullanım Koşulları: https://e-islam.net/kosullar
Destek: info@e-islam.net
```

### Anahtar kelimeler (max 100 karakter, virgül yok)

```
islam,kuran,ezan,namaz,kıble,tesbih,dini,müslüman,ibadet,kuran,ramazan,dua
```

---

## Bölüm 4 — Ekran görüntüleri (screenshot)

Her mağaza en az **2**, ideal **4–8** ekran görüntüsü ister.

**Önerilen ekranlar (sırayla):**

1. Ana sayfa / drawer menü
2. Kuran ekranı
3. Ezan vakitleri
4. AI Chat
5. Premium / paywall
6. Kıble pusulası
7. Quiz / yarışma

**Boyutlar (yaklaşık):**

| Mağaza | Telefon |
|--------|---------|
| Google Play | 1080×1920 veya 1080×2340 (PNG/JPEG) |
| App Store | 6.7" → 1290×2796 px |

Telefonda Expo Go veya dev client ile ekranları açıp **güç + ses kıs** ile screenshot alın.

**Feature graphic (sadece Play):** 1024×500 px — banner veya logo + slogan

---

## Bölüm 5 — Play Console formları (hatırlatma)

| Form | Cevap |
|------|-------|
| Gizlilik politikası URL | https://e-islam.net/gizlilik |
| Reklamlar var mı? | Evet |
| Uygulama içi satın alma | Evet (abonelik) |
| Hedef kitle | Genel / 13+ |
| Veri güvenliği | Konum (isteğe bağlı), cihaz ID, satın alma — gizlilik sayfasına uygun işaretle |
| İletişim e-postası | info@e-islam.net |

---

## Sıradaki adım özeti

1. **Şimdi:** AdMob hesabı aç → Android App ID + Banner ID al → `.env`'e yaz
2. **Şimdi:** Telefonda screenshot al
3. **Play onayı gelince:** Metinleri yapıştır + abonelik ürünleri oluştur
4. **Apple onayı gelince:** App Store metinleri + iOS AdMob
5. **Sonra:** `npx eas-cli build --profile development --platform android`

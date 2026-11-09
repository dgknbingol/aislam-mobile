import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { isNativeAdsAvailable } from '../constants/ads';
import { useSubscription } from '../context/SubscriptionContext';
import { ChatApiError } from '../services/chatApi';
import { preloadRewardedAd, showRewardedAd } from '../services/rewardedAds';

const CARD = {
  bg: '#EAF2FB',
  accent: '#173B63',
  title: '#0D1930',
  body: '#34425B',
  button: '#173B63',
  buttonText: '#FFFFFF',
} as const;

/**
 * Ana sayfa: reklam izle → +1 sohbet hakkı (günde max 5).
 * Premium ve rewardedRemaining=0 iken gizlenir.
 */
export default function RewardedBonusCard() {
  const { quota, claimRewardedBonus } = useSubscription();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    preloadRewardedAd();
  }, []);

  const onWatch = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await showRewardedAd();
      if (result.status === 'unavailable') {
        Alert.alert(
          'Reklam hazır değil',
          'Reklam henüz yüklenmedi. Birkaç saniye sonra tekrar deneyin.',
        );
        return;
      }
      if (result.status === 'dismissed') {
        Alert.alert(
          'Ödül kazanılmadı',
          'Reklamı sonuna kadar izlemen gerekiyor. Bitince hak otomatik eklenir.',
        );
        return;
      }
      if (result.status === 'error') {
        Alert.alert('Reklam hatası', result.message);
        return;
      }

      await claimRewardedBonus();
      Alert.alert('Tebrikler', '1 ek sohbet hakkı kazandın.');
    } catch (error) {
      const message =
        error instanceof ChatApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Hak eklenemedi.';
      Alert.alert('Hata', message);
    } finally {
      setBusy(false);
    }
  }, [busy, claimRewardedBonus]);

  if (!isNativeAdsAvailable()) {
    return null;
  }
  if (!quota || quota.premium) {
    return null;
  }
  if (quota.rewardedRemaining <= 0) {
    return null;
  }

  return (
    <View style={styles.card}>
      <View style={styles.accent} />
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Ionicons name="play-circle" size={20} color={CARD.accent} />
          <Text style={styles.title} numberOfLines={1}>
            Sohbet Hakkı Kazan
          </Text>
        </View>
        <Text style={styles.body} numberOfLines={2}>
          Kısa bir reklam izleyerek bugün {quota.rewardedRemaining} ek soru hakkı
          kazanabilirsin.
        </Text>
        <Pressable
          onPress={() => void onWatch()}
          disabled={busy}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
            busy && styles.buttonBusy,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Reklam izle, bir sohbet hakkı kazan"
        >
          {busy ? (
            <ActivityIndicator size="small" color={CARD.buttonText} />
          ) : (
            <Text style={styles.buttonText} numberOfLines={1}>
              Reklam izle +1 Soru
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: CARD.bg,
    borderRadius: 16,
    marginBottom: 14,
    overflow: 'hidden',
  },
  accent: {
    width: 4,
    backgroundColor: CARD.accent,
  },
  content: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: CARD.title,
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
    color: CARD.body,
    marginBottom: 10,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: CARD.button,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonBusy: {
    opacity: 0.75,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
    color: CARD.buttonText,
  },
});

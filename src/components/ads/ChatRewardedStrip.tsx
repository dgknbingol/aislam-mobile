import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';

import { isNativeAdsAvailable } from '../../constants/ads';
import { useSubscription } from '../../context/SubscriptionContext';
import { ChatApiError } from '../../services/chatApi';
import { preloadRewardedAd, showRewardedAd } from '../../services/rewardedAds';

const HONEY = {
  card: '#F2D27A',
  border: '#C9A33D',
  title: '#0D1930',
} as const;

/**
 * Chat input üstü: ince full-bleed bal altını şerit.
 * Reklam izle → +1 sohbet hakkı.
 */
export default function ChatRewardedStrip() {
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
  if (!quota || quota.premium || quota.rewardedRemaining <= 0) {
    return null;
  }

  return (
    <Pressable
      onPress={() => void onWatch()}
      disabled={busy}
      style={({ pressed }) => [styles.strip, pressed && styles.stripPressed, busy && styles.stripBusy]}
      accessibilityRole="button"
      accessibilityLabel="Reklam izle, bir sohbet hakkı kazan"
    >
      {busy ? (
        <ActivityIndicator size="small" color={HONEY.title} />
      ) : (
        <Ionicons name="play-circle" size={18} color={HONEY.title} />
      )}
      <Text style={styles.label} numberOfLines={1}>
        Reklam izle + 1 Sohbet Hakkı Kazan
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 38,
    paddingHorizontal: 14,
    backgroundColor: HONEY.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: HONEY.border,
  },
  stripPressed: {
    opacity: 0.92,
  },
  stripBusy: {
    opacity: 0.8,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: HONEY.title,
  },
});

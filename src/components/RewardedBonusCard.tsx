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
import { colors } from '../theme/colors';

/**
 * Ana sayfa: reklam izle → +1 sohbet hakkı (günde max 5).
 * Premium ve kota dolu rewardedRemaining=0 iken gizlenir.
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
    <Pressable
      onPress={() => void onWatch()}
      disabled={busy}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed, busy && styles.cardBusy]}
      accessibilityRole="button"
      accessibilityLabel="Reklam izle, bir sohbet hakkı kazan"
    >
      <View style={styles.accent} />
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.emoji}>🎬</Text>
          <Text style={styles.title}>Ek soru hakkı</Text>
        </View>
        <Text style={styles.body}>
          Kısa bir reklam izle, 1 sohbet hakkı kazan. Bugün {quota.rewardedRemaining} hakkın kaldı.
        </Text>
        <View style={styles.ctaRow}>
          {busy ? (
            <ActivityIndicator size="small" color={colors.goldMuted} />
          ) : (
            <Text style={styles.cta}>Reklam izle · +1 soru</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: colors.textOnLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardPressed: {
    opacity: 0.92,
  },
  cardBusy: {
    opacity: 0.75,
  },
  accent: {
    width: 5,
    backgroundColor: '#2E6B9E',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  emoji: {
    fontSize: 18,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textOnLight,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMutedOnLight,
    marginBottom: 10,
  },
  ctaRow: {
    minHeight: 22,
    justifyContent: 'center',
  },
  cta: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2E6B9E',
  },
});

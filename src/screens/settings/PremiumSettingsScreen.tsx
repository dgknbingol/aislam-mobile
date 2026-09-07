import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import SettingsHeader from '../../components/settings/SettingsHeader';
import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '../../constants/legal';
import { PREMIUM_DAILY_CHAT_LIMIT, FREE_DAILY_CHAT_LIMIT } from '../../constants/subscription';
import { useSubscription } from '../../context/SubscriptionContext';
import { colors } from '../../theme/colors';
import { openLegalUrl } from '../../utils/openLegalUrl';

function formatPrice(priceString: string | null | undefined, fallback: string): string {
  return priceString && priceString.length > 0 ? priceString : fallback;
}

export default function PremiumSettingsScreen() {
  const {
    quota,
    monthlyPackage,
    yearlyPackage,
    isPurchasing,
    isStoreConfigured,
    purchaseMonthly,
    purchaseYearly,
    restore,
  } = useSubscription();
  const insets = useSafeAreaInsets();
  const [error, setError] = useState<string | null>(null);

  const isPremium = quota?.premium === true;

  const handlePurchase = async (type: 'monthly' | 'yearly') => {
    setError(null);
    try {
      if (type === 'monthly') {
        await purchaseMonthly();
      } else {
        await purchaseYearly();
      }
      Alert.alert('Başarılı', 'Premium aboneliğiniz aktif edildi.');
    } catch (purchaseError) {
      const message =
        purchaseError instanceof Error ? purchaseError.message : 'Satın alma tamamlanamadı.';
      if (!message.toLowerCase().includes('cancel')) {
        setError(message);
      }
    }
  };

  const handleRestore = async () => {
    setError(null);
    try {
      await restore();
      Alert.alert('Geri yüklendi', 'Satın alımlarınız kontrol edildi.');
    } catch (restoreError) {
      setError(restoreError instanceof Error ? restoreError.message : 'Geri yükleme başarısız.');
    }
  };

  return (
    <View style={styles.container}>
      <SettingsHeader title="Premium" />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="diamond-outline" size={28} color={colors.gold} />
          </View>
          <Text style={styles.heroTitle}>e-İslam Premium</Text>
          <Text style={styles.heroSubtitle}>
            Günde {PREMIUM_DAILY_CHAT_LIMIT} soru hakkı ve reklamsız deneyim
          </Text>
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Mevcut plan</Text>
          <Text style={styles.statusValue}>{isPremium ? 'Premium' : 'Ücretsiz'}</Text>
          <Text style={styles.statusHint}>
            {isPremium
              ? `Günlük ${quota?.remaining ?? PREMIUM_DAILY_CHAT_LIMIT} soru hakkın kaldı`
              : `Ücretsiz planda günde ${FREE_DAILY_CHAT_LIMIT} soru · ${quota?.remaining ?? FREE_DAILY_CHAT_LIMIT} kaldı`}
          </Text>
        </View>

        {!isPremium ? (
          <>
            <View style={styles.planCard}>
              <Text style={styles.planTitle}>Aylık Premium</Text>
              <Text style={styles.planPrice}>
                {formatPrice(monthlyPackage?.product.priceString, '—')}
              </Text>
              <Text style={styles.planHint}>Her ay yenilenir · istediğin zaman iptal</Text>
              <Pressable
                style={[styles.primaryButton, isPurchasing && styles.buttonDisabled]}
                disabled={isPurchasing || !monthlyPackage}
                onPress={() => void handlePurchase('monthly')}
              >
                {isPurchasing ? (
                  <ActivityIndicator color={colors.cream} />
                ) : (
                  <Text style={styles.primaryButtonText}>Aylık Premium Al</Text>
                )}
              </Pressable>
            </View>

            <View style={styles.planCard}>
              <View style={styles.bestValueBadge}>
                <Text style={styles.bestValueText}>En avantajlı</Text>
              </View>
              <Text style={styles.planTitle}>Yıllık Premium</Text>
              <Text style={styles.planPrice}>
                {formatPrice(yearlyPackage?.product.priceString, '—')}
              </Text>
              <Text style={styles.planHint}>Tek seferde ödeyin, daha uyguna kullanın</Text>
              <Pressable
                style={[styles.primaryButton, isPurchasing && styles.buttonDisabled]}
                disabled={isPurchasing || !yearlyPackage}
                onPress={() => void handlePurchase('yearly')}
              >
                {isPurchasing ? (
                  <ActivityIndicator color={colors.cream} />
                ) : (
                  <Text style={styles.primaryButtonText}>Yıllık Premium Al</Text>
                )}
              </Pressable>
            </View>
          </>
        ) : null}

        <Pressable style={styles.secondaryButton} onPress={() => void handleRestore()}>
          <Text style={styles.secondaryButtonText}>Satın alımları geri yükle</Text>
        </Pressable>

        <View style={styles.legalLinks}>
          <Pressable onPress={() => void openLegalUrl(PRIVACY_POLICY_URL).catch(() => undefined)}>
            <Text style={styles.legalLinkText}>Gizlilik Politikası</Text>
          </Pressable>
          <Text style={styles.legalDot}>·</Text>
          <Pressable onPress={() => void openLegalUrl(TERMS_OF_SERVICE_URL).catch(() => undefined)}>
            <Text style={styles.legalLinkText}>Kullanım Koşulları</Text>
          </Pressable>
        </View>

        {!isStoreConfigured ? (
          <Text style={styles.noteText}>
            Mağaza anahtarları henüz tanımlı değil. RevenueCat ve App Store / Play Console
            yapılandırması tamamlanınca satın alma aktif olur.
          </Text>
        ) : null}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.featureList}>
          <Text style={styles.featureTitle}>Premium ile</Text>
          <Text style={styles.featureItem}>• Günde {PREMIUM_DAILY_CHAT_LIMIT} AI soru hakkı</Text>
          <Text style={styles.featureItem}>• Reklamsız kullanım</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    gap: 14,
  },
  heroCard: {
    backgroundColor: colors.inputField,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(201, 162, 39, 0.35)',
  },
  heroIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(201, 162, 39, 0.14)',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.cream,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 14,
    color: colors.creamMuted,
    textAlign: 'center',
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMutedOnLight,
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textOnLight,
    marginBottom: 4,
  },
  statusHint: {
    fontSize: 13,
    color: colors.textMutedOnLight,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  bestValueBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(201, 162, 39, 0.14)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  bestValueText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.gold,
  },
  planTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textOnLight,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.gold,
  },
  planHint: {
    fontSize: 13,
    color: colors.textMutedOnLight,
    marginBottom: 6,
  },
  primaryButton: {
    backgroundColor: colors.bar,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.cream,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textOnLight,
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  legalLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gold,
  },
  legalDot: {
    fontSize: 13,
    color: colors.textMutedOnLight,
  },
  noteText: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMutedOnLight,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 13,
    color: colors.warning,
    textAlign: 'center',
  },
  featureList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textOnLight,
    marginBottom: 4,
  },
  featureItem: {
    fontSize: 13,
    color: colors.textMutedOnLight,
  },
});

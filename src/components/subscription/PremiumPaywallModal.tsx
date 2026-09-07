import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '../../constants/legal';
import { PREMIUM_DAILY_CHAT_LIMIT } from '../../constants/subscription';
import { useSubscription } from '../../context/SubscriptionContext';
import { colors } from '../../theme/colors';
import { openLegalUrl } from '../../utils/openLegalUrl';

type PlanId = 'monthly' | 'yearly';

interface PremiumPaywallModalProps {
  visible: boolean;
  onClose: () => void;
}

const FEATURES = [
  { icon: 'chatbubbles-outline' as const, label: `Günlük ${PREMIUM_DAILY_CHAT_LIMIT} AI Chat kullanım hakkı` },
  { icon: 'eye-off-outline' as const, label: 'Reklamsız kullanım' },
  { icon: 'trophy-outline' as const, label: 'Potansiyel yarışma ödülleri' },
] as const;

function formatPrice(priceString: string | null | undefined, fallback: string): string {
  return priceString && priceString.length > 0 ? priceString : fallback;
}

function parsePrice(value: string | null | undefined): number | null {
  if (!value) return null;
  const digits = value.replace(/[^\d.,]/g, '').replace(',', '.');
  const parsed = Number.parseFloat(digits);
  return Number.isFinite(parsed) ? parsed : null;
}

function computeYearlyDiscountPercent(
  monthlyPrice: string | null | undefined,
  yearlyPrice: string | null | undefined,
): number | null {
  const monthly = parsePrice(monthlyPrice);
  const yearly = parsePrice(yearlyPrice);
  if (!monthly || !yearly || monthly <= 0) return null;

  const fullYearMonthly = monthly * 12;
  const saved = Math.round((1 - yearly / fullYearMonthly) * 100);
  return saved > 0 && saved < 100 ? saved : null;
}

export default function PremiumPaywallModal({ visible, onClose }: PremiumPaywallModalProps) {
  const insets = useSafeAreaInsets();
  const {
    monthlyPackage,
    yearlyPackage,
    isPurchasing,
    purchaseMonthly,
    purchaseYearly,
    restore,
  } = useSubscription();

  const [selectedPlan, setSelectedPlan] = useState<PlanId>('yearly');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setSelectedPlan('yearly');
    setError(null);
  }, [visible]);

  const discountPercent = useMemo(
    () => computeYearlyDiscountPercent(monthlyPackage?.product.priceString, yearlyPackage?.product.priceString),
    [monthlyPackage, yearlyPackage],
  );

  const monthlyPrice = formatPrice(monthlyPackage?.product.priceString, '—');
  const yearlyPrice = formatPrice(yearlyPackage?.product.priceString, '—');

  const ctaPrice = selectedPlan === 'yearly' ? yearlyPrice : monthlyPrice;
  const ctaPeriod = selectedPlan === 'yearly' ? 'yıl' : 'ay';

  const handlePurchase = async () => {
    setError(null);
    try {
      if (selectedPlan === 'yearly') {
        await purchaseYearly();
      } else {
        await purchaseMonthly();
      }
      Alert.alert('Başarılı', 'Premium aboneliğiniz aktif edildi.');
      onClose();
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
      onClose();
    } catch (restoreError) {
      setError(restoreError instanceof Error ? restoreError.message : 'Geri yükleme başarısız.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Kapat" />

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.handle} />

          <Pressable style={styles.closeButton} onPress={onClose} accessibilityLabel="Kapat">
            <Ionicons name="close" size={18} color={colors.creamMuted} />
          </Pressable>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
            bounces={false}
          >
            <View style={styles.iconWrap}>
              <Ionicons name="diamond" size={28} color={colors.bar} />
            </View>

            <Text style={styles.title}>Premium'a Geç, Sınırları Kaldır!</Text>

            <Text style={styles.sectionTitle}>Premium Ayrıcalıkları</Text>

            <View style={styles.featureGrid}>
              {FEATURES.map((feature) => (
                <View key={feature.label} style={styles.featureCard}>
                  <Ionicons name={feature.icon} size={16} color={colors.gold} />
                  <Text style={styles.featureText}>{feature.label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.planRow}>
              <Pressable
                style={[styles.planCard, selectedPlan === 'monthly' && styles.planCardSelected]}
                onPress={() => setSelectedPlan('monthly')}
              >
                <Text style={[styles.planLabel, selectedPlan === 'monthly' && styles.planLabelSelected]}>
                  Aylık
                </Text>
                <Text style={[styles.planPrice, selectedPlan === 'monthly' && styles.planPriceSelected]}>
                  {monthlyPrice}
                </Text>
                <Text style={styles.planPeriod}>/ ay</Text>
              </Pressable>

              <Pressable
                style={[styles.planCard, selectedPlan === 'yearly' && styles.planCardSelected]}
                onPress={() => setSelectedPlan('yearly')}
              >
                {discountPercent ? (
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>%{discountPercent} İNDİRİM</Text>
                  </View>
                ) : (
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>EN AVANTAJLI</Text>
                  </View>
                )}
                <Text style={[styles.planLabel, selectedPlan === 'yearly' && styles.planLabelSelected]}>
                  Yıllık
                </Text>
                <Text style={[styles.planPrice, selectedPlan === 'yearly' && styles.planPriceSelected]}>
                  {yearlyPrice}
                </Text>
                <Text style={styles.planPeriod}>/ yıl</Text>
              </Pressable>
            </View>

            <Pressable
              style={[styles.ctaButton, isPurchasing && styles.ctaButtonDisabled]}
              disabled={isPurchasing}
              onPress={() => void handlePurchase()}
            >
              {isPurchasing ? (
                <ActivityIndicator color={colors.bar} />
              ) : (
                <Text style={styles.ctaText}>
                  Şimdi Başla — {ctaPrice} / {ctaPeriod}
                </Text>
              )}
            </Pressable>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.footerLinks}>
              <Pressable onPress={() => void handleRestore()}>
                <Text style={styles.footerLink}>Satın almayı geri yükle</Text>
              </Pressable>
              <Text style={styles.footerDot}>·</Text>
              <Pressable onPress={() => void openLegalUrl(PRIVACY_POLICY_URL).catch(() => undefined)}>
                <Text style={styles.footerLink}>Gizlilik</Text>
              </Pressable>
              <Text style={styles.footerDot}>·</Text>
              <Pressable onPress={() => void openLegalUrl(TERMS_OF_SERVICE_URL).catch(() => undefined)}>
                <Text style={styles.footerLink}>Koşullar</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 23, 52, 0.72)',
  },
  sheet: {
    maxHeight: '92%',
    backgroundColor: colors.bar,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(245, 240, 230, 0.12)',
    paddingTop: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(245, 240, 230, 0.25)',
    marginBottom: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 2,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 240, 230, 0.08)',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
    alignItems: 'center',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: colors.send,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    alignSelf: 'flex-start',
    width: '100%',
    fontSize: 15,
    fontWeight: '700',
    color: colors.cream,
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.cream,
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 22,
  },
  featureGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 22,
  },
  featureCard: {
    width: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: colors.inputField,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(245, 240, 230, 0.1)',
  },
  featureText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.cream,
    lineHeight: 16,
  },
  planRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  planCard: {
    flex: 1,
    minHeight: 118,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: colors.inputField,
    borderWidth: 1.5,
    borderColor: 'rgba(245, 240, 230, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planCardSelected: {
    borderColor: colors.send,
    backgroundColor: 'rgba(244, 221, 146, 0.08)',
  },
  discountBadge: {
    position: 'absolute',
    top: -10,
    alignSelf: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: colors.send,
  },
  discountText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
    color: colors.bar,
  },
  planLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.creamMuted,
    marginBottom: 6,
  },
  planLabelSelected: {
    color: colors.cream,
  },
  planPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.creamMuted,
  },
  planPriceSelected: {
    color: colors.cream,
  },
  planPeriod: {
    fontSize: 12,
    color: colors.creamMuted,
    marginTop: 2,
  },
  ctaButton: {
    width: '100%',
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: colors.send,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  ctaButtonDisabled: {
    opacity: 0.75,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.bar,
  },
  errorText: {
    fontSize: 12,
    color: colors.warning,
    textAlign: 'center',
    marginBottom: 8,
  },
  footerLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  footerLink: {
    fontSize: 12,
    color: colors.creamMuted,
    fontWeight: '500',
  },
  footerDot: {
    fontSize: 12,
    color: colors.creamMuted,
  },
});

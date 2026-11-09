import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import PremiumPaywallModal from '../subscription/PremiumPaywallModal';
import { PREMIUM_UI_ENABLED } from '../../constants/subscription';
import { useSubscription } from '../../context/SubscriptionContext';

const HONEY = {
  card: '#F2D27A',
  border: '#C9A33D',
  title: '#0D1930',
  subtitle: '#34425B',
  iconBg: 'rgba(13, 25, 48, 0.08)',
} as const;

/**
 * Inline “Reklamları kaldır” CTA — Premium paywall açar.
 * Mat bal altını zemin (krem sayfada dikkat çeker).
 */
export default function RemoveAdsBanner() {
  const { quota } = useSubscription();
  const [paywallVisible, setPaywallVisible] = useState(false);

  if (!PREMIUM_UI_ENABLED || quota?.premium) {
    return null;
  }

  return (
    <>
      <Pressable
        onPress={() => setPaywallVisible(true)}
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        accessibilityRole="button"
        accessibilityLabel="Reklamları kaldır, Premium'a geç"
      >
        <View style={styles.iconWrap}>
          <Ionicons name="sparkles" size={18} color={HONEY.title} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title}>Reklamları kaldır</Text>
          <Text style={styles.subtitle}>Daha sade bir deneyim için Premium’a geç</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={HONEY.title} />
      </Pressable>

      <PremiumPaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: HONEY.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HONEY.border,
  },
  rowPressed: {
    opacity: 0.92,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: HONEY.iconBg,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: HONEY.title,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
    color: HONEY.subtitle,
  },
});

import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AdBanner from './AdBanner';
import PremiumPaywallModal from '../subscription/PremiumPaywallModal';
import { isNativeAdsAvailable } from '../../constants/ads';
import { PREMIUM_UI_ENABLED } from '../../constants/subscription';
import { useSubscription } from '../../context/SubscriptionContext';
import { colors } from '../../theme/colors';

/**
 * Tüm ekranların altında sabit banner.
 * Klavye açıkken gizlenir — chat input klavyenin altında kalmasın.
 * Sağ üst X → Premium (reklamları kaldır).
 */
export default function GlobalAdBannerHost() {
  const insets = useSafeAreaInsets();
  const { quota } = useSubscription();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  if (quota?.premium || !isNativeAdsAvailable() || keyboardVisible) {
    return null;
  }

  return (
    <View style={[styles.host, { paddingBottom: Math.max(insets.bottom, 0) }]}>
      <View style={styles.bannerWrap}>
        <AdBanner />
        {PREMIUM_UI_ENABLED ? (
          <Pressable
            onPress={() => setPaywallVisible(true)}
            style={styles.closeButton}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Reklamları kaldır, Premium'a geç"
          >
            <Ionicons name="close" size={14} color={colors.cream} />
          </Pressable>
        ) : null}
      </View>

      {PREMIUM_UI_ENABLED ? (
        <PremiumPaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    backgroundColor: colors.bar,
  },
  bannerWrap: {
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(2, 23, 52, 0.82)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(245, 240, 230, 0.35)',
    zIndex: 2,
  },
});

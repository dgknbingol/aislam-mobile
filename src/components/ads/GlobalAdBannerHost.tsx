import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AdBanner from './AdBanner';
import { isNativeAdsAvailable } from '../../constants/ads';
import { useSubscription } from '../../context/SubscriptionContext';
import { colors } from '../../theme/colors';

/**
 * Tüm ekranların altında sabit banner.
 * Safe-area (home indicator) burada; alt menü / chat input ekstra insets almaz.
 */
export default function GlobalAdBannerHost() {
  const insets = useSafeAreaInsets();
  const { quota } = useSubscription();

  if (quota?.premium || !isNativeAdsAvailable()) {
    return null;
  }

  return (
    <View style={[styles.host, { paddingBottom: Math.max(insets.bottom, 0) }]}>
      <AdBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    backgroundColor: colors.bar,
  },
});

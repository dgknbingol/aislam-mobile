import { useEffect, useState } from 'react';
import { Keyboard, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AdBanner from './AdBanner';
import { isNativeAdsAvailable } from '../../constants/ads';
import { useSubscription } from '../../context/SubscriptionContext';
import { colors } from '../../theme/colors';

/**
 * Tüm ekranların altında sabit banner.
 * Klavye açıkken gizlenir — chat input klavyenin altında kalmasın.
 */
export default function GlobalAdBannerHost() {
  const insets = useSafeAreaInsets();
  const { quota } = useSubscription();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

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
      <AdBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    backgroundColor: colors.bar,
  },
});

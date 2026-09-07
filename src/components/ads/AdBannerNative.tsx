import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

import { getBannerAdUnitId } from '../../constants/ads';
import { colors } from '../../theme/colors';

export default function AdBannerNative() {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return null;
  }

  return (
    <View style={styles.container} accessibilityLabel="Reklam alanı">
      <BannerAd
        unitId={getBannerAdUnitId()}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.inputField,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.barBorder,
    paddingVertical: 4,
  },
});

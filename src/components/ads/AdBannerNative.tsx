import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

import { getBannerAdUnitId } from '../../constants/ads';
import { colors } from '../../theme/colors';

interface AdBannerNativeProps {
  inline?: boolean;
}

export default function AdBannerNative({ inline = false }: AdBannerNativeProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return null;
  }

  return (
    <View
      style={[styles.container, inline && styles.containerInline]}
      accessibilityLabel="Reklam alanı"
    >
      <BannerAd
        unitId={getBannerAdUnitId()}
        size={
          inline
            ? BannerAdSize.INLINE_ADAPTIVE_BANNER
            : BannerAdSize.ANCHORED_ADAPTIVE_BANNER
        }
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
  containerInline: {
    marginBottom: 14,
    borderTopWidth: 0,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
});

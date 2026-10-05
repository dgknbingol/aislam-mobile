import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import { APP_MAX_FONT_MULTIPLIER } from '../theme/fontScale';
import NextPrayerVectorIcon from './prayer-banners/NextPrayerVectorIcon';
import type { PrayerBannerId } from './prayer-banners/shared';

interface NextPrayerCardProps {
  prayerName: string;
  prayerTime: string;
  remainingText: string;
  prayerId?: PrayerBannerId;
}

export default function NextPrayerCard({
  prayerName,
  prayerTime,
  remainingText,
  prayerId = 'ogle',
}: NextPrayerCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.textBlock}>
        <Text style={styles.label} maxFontSizeMultiplier={APP_MAX_FONT_MULTIPLIER}>
          Bir Sonraki Ezan
        </Text>
        <Text
          style={styles.time}
          numberOfLines={2}
          maxFontSizeMultiplier={APP_MAX_FONT_MULTIPLIER}
        >
          {prayerName} — {prayerTime}
        </Text>
        <Text style={styles.remaining} maxFontSizeMultiplier={APP_MAX_FONT_MULTIPLIER}>
          {remainingText}
        </Text>
      </View>

      <View style={styles.iconWrap}>
        <NextPrayerVectorIcon id={prayerId} size={56} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.inputField,
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: colors.barBorder,
  },
  textBlock: {
    flex: 1,
    paddingRight: 12,
  },
  label: {
    fontSize: 13,
    color: colors.creamMuted,
    marginBottom: 6,
  },
  time: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.cream,
    marginBottom: 4,
  },
  remaining: {
    fontSize: 13,
    color: colors.gold,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(245, 240, 230, 0.12)',
  },
});

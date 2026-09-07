import { Image } from 'expo-image';
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';
import { getPrayerBannerAspect, PRAYER_BANNER_IMAGES } from './prayerBannerAssets';
import type { PrayerBannerId } from './shared';

interface PrayerTimeBannerCardProps {
  id: PrayerBannerId;
  label: string;
  time: string;
  isActive: boolean;
  isPast: boolean;
}

function PrayerTimeBannerCard({
  id,
  label,
  time,
  isActive,
  isPast,
}: PrayerTimeBannerCardProps) {
  return (
    <View
      style={[
        styles.card,
        isActive && styles.cardActive,
        isPast && !isActive && styles.cardPast,
      ]}
    >
      <Image
        source={PRAYER_BANNER_IMAGES[id]}
        style={[styles.bannerImage, { aspectRatio: getPrayerBannerAspect(id) }]}
        contentFit="cover"
        cachePolicy="memory-disk"
        recyclingKey={id}
        transition={0}
        accessibilityIgnoresInvertColors
      />

      <View style={styles.labelPanel} pointerEvents="none">
        <Text style={[styles.label, isActive && styles.labelActive]}>{label}</Text>
        <Text style={[styles.time, isActive && styles.timeActive]}>{time}</Text>
      </View>

      {isActive ? (
        <View style={styles.activeBadge} pointerEvents="none">
          <Text style={styles.activeBadgeText}>Sıradaki</Text>
        </View>
      ) : null}
    </View>
  );
}

export default memo(PrayerTimeBannerCard);

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.barBorder,
    backgroundColor: colors.inputField,
  },
  cardActive: {
    borderColor: colors.gold,
    borderWidth: 2,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 5,
  },
  cardPast: {
    opacity: 0.58,
  },
  bannerImage: {
    width: '100%',
  },
  labelPanel: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '23%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    backgroundColor: 'rgba(2, 23, 52, 0.58)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 4,
  },
  labelActive: {
    color: colors.gold,
  },
  time: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  timeActive: {
    color: colors.gold,
  },
  activeBadge: {
    position: 'absolute',
    top: 8,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(2, 23, 52, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 39, 0.55)',
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.gold,
    letterSpacing: 0.4,
  },
});

import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import type { PrayerDay } from '../../services/prayerTimesApi';
import { getNextPrayer, getPrayerStatuses } from '../../services/prayerTimesApi';
import { colors } from '../../theme/colors';
import PrayerTimeBannerCard from './PrayerTimeBannerCard';
import { PRAYER_BANNERS } from './shared';

interface TodayPrayerTimesSectionProps {
  todayPrayerDay?: PrayerDay;
  tomorrowPrayerDay?: PrayerDay;
  now?: Date;
  isLoading: boolean;
}

export default function TodayPrayerTimesSection({
  todayPrayerDay,
  tomorrowPrayerDay,
  now = new Date(),
  isLoading,
}: TodayPrayerTimesSectionProps) {
  if (isLoading && !todayPrayerDay) {
    return (
      <View style={styles.loadingRow}>
        <ActivityIndicator size="small" color={colors.gold} />
        <Text style={styles.loadingText}>Günün vakitleri yükleniyor...</Text>
      </View>
    );
  }

  if (!todayPrayerDay) {
    return null;
  }

  const nextPrayer = getNextPrayer(todayPrayerDay, tomorrowPrayerDay, now);
  const statuses = getPrayerStatuses(todayPrayerDay, tomorrowPrayerDay, now);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Günün Vakitleri</Text>
        <View style={styles.sectionLine} />
      </View>

      {PRAYER_BANNERS.map((banner) => {
        const { isActive, isPast } = statuses[banner.id];
        const displayTime =
          isActive && nextPrayer?.id === banner.id ? nextPrayer.time : todayPrayerDay[banner.timeKey];

        return (
          <PrayerTimeBannerCard
            key={banner.id}
            id={banner.id}
            label={banner.label}
            time={displayTime}
            isActive={isActive}
            isPast={isPast}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMutedOnLight,
    letterSpacing: 0.3,
  },
  sectionLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(2, 23, 52, 0.15)',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 20,
    justifyContent: 'center',
    marginBottom: 8,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textMutedOnLight,
  },
});

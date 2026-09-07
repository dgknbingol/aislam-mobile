import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeBottomNav from '../components/HomeBottomNav';
import { useLocationContext } from '../context/LocationContext';
import { useHomeTabNavigation } from '../hooks/useHomeTabNavigation';
import type { PrayerDay } from '../services/prayerTimesApi';
import { colors } from '../theme/colors';

const COLUMNS = [
  { key: 'gregorian', label: 'Miladi Tarih', width: 168 },
  { key: 'hijri', label: 'Hicri Tarih', width: 130 },
  { key: 'imsak', label: 'İmsak', width: 58 },
  { key: 'gunes', label: 'Güneş', width: 58 },
  { key: 'ogle', label: 'Öğle', width: 58 },
  { key: 'ikindi', label: 'İkindi', width: 58 },
  { key: 'aksam', label: 'Akşam', width: 58 },
  { key: 'yatsi', label: 'Yatsı', width: 58 },
] as const;

const TABLE_WIDTH = COLUMNS.reduce((sum, col) => sum + col.width, 0);

function getCellValue(day: PrayerDay, key: (typeof COLUMNS)[number]['key']): string {
  switch (key) {
    case 'gregorian':
      return day.gregorianLabel;
    case 'hijri':
      return day.hijriLabel;
    case 'imsak':
      return day.imsak;
    case 'gunes':
      return day.gunes;
    case 'ogle':
      return day.ogle;
    case 'ikindi':
      return day.ikindi;
    case 'aksam':
      return day.aksam;
    case 'yatsi':
      return day.yatsi;
    default:
      return '';
  }
}

function formatMonthTitle(year: number, month: number): string {
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
}

export default function PrayerTimesScreen() {
  const insets = useSafeAreaInsets();
  const handleTabPress = useHomeTabNavigation();
  const verticalScrollRef = useRef<ScrollView>(null);
  const {
    monthlyPrayerTimes,
    isLoadingPrayerTimes,
    prayerTimesError,
    refreshPrayerTimes,
    permissionDenied,
  } = useLocationContext();

  const scrollToToday = useCallback(() => {
    if (!monthlyPrayerTimes) return;
    const todayIndex = monthlyPrayerTimes.days.findIndex((day) => day.today);
    if (todayIndex < 0) return;
    verticalScrollRef.current?.scrollTo({ y: todayIndex * 44, animated: true });
  }, [monthlyPrayerTimes]);

  useEffect(() => {
    if (!monthlyPrayerTimes || isLoadingPrayerTimes) return;
    const timer = setTimeout(scrollToToday, 300);
    return () => clearTimeout(timer);
  }, [monthlyPrayerTimes, isLoadingPrayerTimes, scrollToToday]);

  const monthTitle =
    monthlyPrayerTimes != null
      ? formatMonthTitle(monthlyPrayerTimes.year, monthlyPrayerTimes.month)
      : '';

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Ezan Vakitleri</Text>
          {monthTitle ? <Text style={styles.headerSubtitle}>{monthTitle}</Text> : null}
        </View>
        <Pressable
          style={styles.todayButton}
          onPress={scrollToToday}
          accessibilityLabel="Bugüne git"
        >
          <Ionicons name="today-outline" size={22} color={colors.cream} />
        </Pressable>
      </View>

      {permissionDenied ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            Konum izni verilmedi. İstanbul vakitleri gösteriliyor.
          </Text>
        </View>
      ) : null}

      {isLoadingPrayerTimes ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.gold} />
          <Text style={styles.stateText}>Vakitler yükleniyor...</Text>
        </View>
      ) : prayerTimesError ? (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{prayerTimesError}</Text>
          <Pressable onPress={refreshPrayerTimes} style={styles.retryButton}>
            <Text style={styles.retryText}>Tekrar dene</Text>
          </Pressable>
        </View>
      ) : monthlyPrayerTimes ? (
        <ScrollView
          style={styles.tableScrollVertical}
          ref={verticalScrollRef}
          contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
          showsVerticalScrollIndicator
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator
            contentContainerStyle={styles.tableHorizontalContent}
          >
            <View style={[styles.table, { width: TABLE_WIDTH }]}>
              <View style={styles.headerRow}>
                {COLUMNS.map((col) => (
                  <Text
                    key={col.key}
                    style={[styles.headerCell, { width: col.width }]}
                    numberOfLines={1}
                  >
                    {col.label}
                  </Text>
                ))}
              </View>

              {monthlyPrayerTimes.days.map((day) => (
                <View
                  key={day.date}
                  style={[styles.dataRow, day.today && styles.dataRowToday]}
                >
                  {COLUMNS.map((col) => (
                    <Text
                      key={col.key}
                      style={[
                        styles.dataCell,
                        { width: col.width },
                        day.today && styles.dataCellToday,
                      ]}
                      numberOfLines={2}
                    >
                      {getCellValue(day, col.key)}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
        </ScrollView>
      ) : null}

      <View style={styles.bottomNavWrap}>
        <HomeBottomNav activeTab="home" onTabPress={handleTabPress} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: colors.bar,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.barBorder,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.cream,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.creamMuted,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  todayButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  banner: {
    backgroundColor: 'rgba(201, 162, 39, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  bannerText: {
    fontSize: 13,
    color: colors.gold,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  stateText: {
    fontSize: 14,
    color: colors.creamMuted,
  },
  errorText: {
    fontSize: 14,
    color: colors.creamMuted,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.inputField,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.cream,
  },
  tableScrollVertical: {
    flex: 1,
  },
  tableHorizontalContent: {
    paddingVertical: 8,
  },
  table: {
    backgroundColor: '#111111',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333333',
  },
  headerCell: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    fontSize: 12,
    fontWeight: '600',
    color: '#B0B0B0',
  },
  dataRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#222222',
  },
  dataRowToday: {
    backgroundColor: '#2A2A2A',
  },
  dataCell: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    fontSize: 12,
    color: '#D8D8D8',
  },
  dataCellToday: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  bottomNavWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});

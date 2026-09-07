import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useMemo, useRef } from 'react';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  RELIGIOUS_DAYS_2026,
  formatReligiousDayDate,
  formatReligiousDayCountdown,
  getNextReligiousDay,
  groupReligiousDaysByMonth,
  isReligiousDayPast,
  isReligiousDayToday,
  type ReligiousDay,
  type ReligiousDayCategory,
} from '../constants/religiousDays2026';
import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';

function categoryAccent(category: ReligiousDayCategory): string {
  switch (category) {
    case 'kandil':
      return '#8B6FA8';
    case 'bayram':
      return '#2E7D4F';
    case 'arefe':
      return '#C2410C';
    case 'ramazan':
      return colors.bar;
    default:
      return colors.gold;
  }
}

function ReligiousDayCard({ day }: { day: ReligiousDay }) {
  const { day: dayNumber, monthWeekday } = formatReligiousDayDate(day.date);
  const isToday = isReligiousDayToday(day);
  const isPast = isReligiousDayPast(day);
  const countdown = formatReligiousDayCountdown(day);

  return (
    <View style={[styles.card, isPast && !isToday && styles.cardPast]}>
      <View style={styles.dateColumn}>
        <Text style={[styles.dateDay, isPast && !isToday && styles.dateMuted]}>{dayNumber}</Text>
        <Text style={[styles.dateMeta, isPast && !isToday && styles.dateMuted]}>{monthWeekday}</Text>
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.cardBody}>
        <Text style={[styles.cardTitle, { color: categoryAccent(day.category) }]}>{day.title}</Text>
        <Text style={styles.cardHijri}>{day.hijriLabel}</Text>
        <Text
          style={[
            styles.cardCountdown,
            isToday && styles.cardCountdownToday,
            isPast && !isToday && styles.cardCountdownPast,
          ]}
        >
          {countdown}
        </Text>
      </View>
    </View>
  );
}

export default function ReligiousDaysScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const listRef = useRef<SectionList<ReligiousDay>>(null);

  const sections = useMemo(() => {
    return groupReligiousDaysByMonth(RELIGIOUS_DAYS_2026).map((section) => ({
      title: section.monthLabel,
      data: section.items,
    }));
  }, []);

  const nextDay = useMemo(() => getNextReligiousDay(RELIGIOUS_DAYS_2026), []);

  const scrollToNext = useCallback(() => {
    if (!nextDay) return;
    const sectionIndex = sections.findIndex((section) =>
      section.data.some((item) => item.id === nextDay.id),
    );
    if (sectionIndex < 0) return;
    const itemIndex = sections[sectionIndex].data.findIndex((item) => item.id === nextDay.id);
    listRef.current?.scrollToLocation({
      sectionIndex,
      itemIndex,
      animated: true,
      viewOffset: 12,
    });
  }, [nextDay, sections]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.iconButton} accessibilityLabel="Geri">
          <Ionicons name="chevron-back" size={24} color={colors.cream} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Dini Günler 2026</Text>
          {nextDay ? (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              Sıradaki: {nextDay.title}
            </Text>
          ) : null}
        </View>
        <Pressable onPress={scrollToNext} style={styles.iconButton} accessibilityLabel="Sıradaki güne git">
          <Ionicons name="calendar-outline" size={22} color={colors.cream} />
        </Pressable>
      </View>

      <SectionList
        ref={listRef}
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 24 }]}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionTitle}>{section.title}</Text>
        )}
        renderItem={({ item }) => <ReligiousDayCard day={item} />}
        ListFooterComponent={
          <Text style={styles.footerNote}>
            Tarihler Diyanet İşleri Başkanlığı 2026 takvimine göredir.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    backgroundColor: colors.bar,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.barBorder,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.cream,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.creamMuted,
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textOnLight,
    marginTop: 8,
    marginBottom: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.bar,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.barBorder,
  },
  cardPast: {
    opacity: 0.72,
  },
  dateColumn: {
    width: 72,
    alignItems: 'center',
  },
  dateDay: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.cream,
    lineHeight: 32,
  },
  dateMeta: {
    fontSize: 11,
    color: colors.creamMuted,
    textAlign: 'center',
    lineHeight: 15,
    marginTop: 2,
  },
  dateMuted: {
    color: 'rgba(245, 240, 230, 0.55)',
  },
  cardDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(245, 240, 230, 0.2)',
  },
  cardBody: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  cardHijri: {
    fontSize: 12,
    color: colors.creamMuted,
  },
  cardCountdown: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
    color: colors.gold,
  },
  cardCountdownToday: {
    color: colors.gold,
  },
  cardCountdownPast: {
    color: 'rgba(245, 240, 230, 0.55)',
    fontWeight: '600',
  },
  footerNote: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMutedOnLight,
    textAlign: 'center',
  },
});

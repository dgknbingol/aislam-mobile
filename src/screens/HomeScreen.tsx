import { Ionicons } from '@expo/vector-icons';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { APP_NAME } from '../constants/app';
import { getAsmaOfDay } from '../constants/asmaUlHusna';
import DailyContentCard from '../components/DailyContentCard';
import HomeBottomNav, { HOME_BOTTOM_NAV_CONTENT_PAD } from '../components/HomeBottomNav';
import AdBanner from '../components/ads/AdBanner';
import HomeCompetitionSection from '../components/quiz/HomeCompetitionSection';
import HomeScoreStatusSection from '../components/quiz/HomeScoreStatusSection';
import NextPrayerCard from '../components/NextPrayerCard';
import TodayPrayerTimesSection from '../components/prayer-banners/TodayPrayerTimesSection';
import { useLocationContext } from '../context/LocationContext';
import { useHomeTabNavigation } from '../hooks/useHomeTabNavigation';
import type { RootStackParamList } from '../navigation/types';
import { fetchDailyContent, getCachedDailyContent, type DailyContentResponse } from '../services/dailyApi';
import { loadHutbes } from '../services/hutbeApi';
import { formatHutbeDate, type HutbeItem } from '../services/hutbeStorage';
import {
  formatRemainingUntil,
  getAdjacentPrayerDay,
  getNextPrayer,
} from '../services/prayerTimesApi';
import { getCachedVerseOfDay, getVerseOfDay, type VerseOfDay } from '../services/verseOfDay';
import { colors } from '../theme/colors';

function formatTodayDate(): string {
  return new Date().toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function HomeScreen() {
  const navigation = useNavigation<
    CompositeNavigationProp<
      DrawerNavigationProp<Record<string, undefined>>,
      NativeStackNavigationProp<RootStackParamList>
    >
  >();
  const insets = useSafeAreaInsets();
  const handleTabPress = useHomeTabNavigation();
  const { todayPrayerDay, monthlyPrayerTimes, isLoadingPrayerTimes } = useLocationContext();
  const [now, setNow] = useState(() => new Date());
  const [dailyContent, setDailyContent] = useState<DailyContentResponse | null>(null);
  const [isLoadingDaily, setIsLoadingDaily] = useState(true);
  const [dailyError, setDailyError] = useState<string | null>(null);
  const hasDailyContentRef = useRef(false);
  const [verseOfDay, setVerseOfDay] = useState<VerseOfDay | null>(null);
  const [isLoadingVerse, setIsLoadingVerse] = useState(true);
  const [verseError, setVerseError] = useState<string | null>(null);
  const [latestHutbe, setLatestHutbe] = useState<HutbeItem | null>(null);

  const loadDailyContent = useCallback(async (silent = false) => {
    if (!silent) {
      setIsLoadingDaily(true);
      setDailyError(null);
    }
    try {
      const content = await fetchDailyContent();
      setDailyContent(content);
      hasDailyContentRef.current = true;
      setDailyError(null);
    } catch (error) {
      if (!silent && !hasDailyContentRef.current) {
        setDailyError(
          error instanceof Error ? error.message : 'Günlük içerik yüklenemedi.',
        );
      }
    } finally {
      if (!silent) {
        setIsLoadingDaily(false);
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function hydrateVerse() {
      const cached = await getCachedVerseOfDay();
      if (cancelled) return;
      if (cached) {
        setVerseOfDay(cached);
        setIsLoadingVerse(false);
      }
      try {
        const verse = await getVerseOfDay();
        if (!cancelled) {
          setVerseOfDay(verse);
          setVerseError(null);
        }
      } catch (error) {
        if (!cancelled && !cached) {
          setVerseError(
            error instanceof Error ? error.message : 'Günün ayeti yüklenemedi.',
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingVerse(false);
        }
      }
    }

    async function hydrateDailyContent() {
      const cached = await getCachedDailyContent();
      if (cancelled) return;

      if (cached) {
        setDailyContent(cached);
        hasDailyContentRef.current = true;
        setIsLoadingDaily(false);
      }

      await loadDailyContent(hasDailyContentRef.current);
    }

    async function hydrateHutbe() {
      try {
        const list = await loadHutbes(true);
        if (!cancelled) {
          setLatestHutbe(list[0] ?? null);
        }
      } catch {
        // Hutbe kartı opsiyonel; sessizce geç
      }
    }

    void hydrateVerse();
    void hydrateDailyContent();
    void hydrateHutbe();

    return () => {
      cancelled = true;
    };
  }, [loadDailyContent]);

  useFocusEffect(
    useCallback(() => {
      if (hasDailyContentRef.current) {
        void loadDailyContent(true);
      }
    }, [loadDailyContent]),
  );

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const nextPrayer = useMemo(() => {
    if (!todayPrayerDay) return null;
    const tomorrow =
      monthlyPrayerTimes != null
        ? getAdjacentPrayerDay(monthlyPrayerTimes.days, todayPrayerDay, 1)
        : undefined;
    return getNextPrayer(todayPrayerDay, tomorrow, now);
  }, [monthlyPrayerTimes, now, todayPrayerDay]);

  const asmaOfDay = useMemo(() => getAsmaOfDay(), []);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>{APP_NAME}</Text>
          <Text style={styles.headerDate}>Bugün: {formatTodayDate()}</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            style={styles.headerIconButton}
            onPress={() => navigation.navigate('Qibla')}
            accessibilityLabel="Kıble pusulası"
          >
            <Ionicons name="compass-outline" size={24} color={colors.cream} />
          </Pressable>
          <Pressable
            style={styles.headerIconButton}
            onPress={() => navigation.openDrawer()}
            accessibilityLabel="Menü"
          >
            <Ionicons name="menu" size={24} color={colors.cream} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: HOME_BOTTOM_NAV_CONTENT_PAD },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <NextPrayerCard
          prayerName={nextPrayer?.label ?? (isLoadingPrayerTimes ? '...' : '—')}
          prayerTime={nextPrayer?.time ?? '—'}
          remainingText={
            nextPrayer?.time
              ? formatRemainingUntil(nextPrayer.time, now)
              : isLoadingPrayerTimes
                ? 'Vakitler yükleniyor...'
                : 'Vakit bilgisi yok'
          }
          prayerId={nextPrayer?.id ?? 'ogle'}
        />

        <TodayPrayerTimesSection
          todayPrayerDay={todayPrayerDay}
          tomorrowPrayerDay={
            todayPrayerDay && monthlyPrayerTimes
              ? getAdjacentPrayerDay(monthlyPrayerTimes.days, todayPrayerDay, 1)
              : undefined
          }
          now={now}
          isLoading={isLoadingPrayerTimes}
        />

        {isLoadingVerse && !verseOfDay ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.textMutedOnLight} />
            <Text style={styles.loadingText}>Günün ayeti yükleniyor...</Text>
          </View>
        ) : verseError && !verseOfDay ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{verseError}</Text>
          </View>
        ) : verseOfDay ? (
          <DailyContentCard
            emoji="📖"
            title="Günün Ayeti"
            body={verseOfDay.translation}
            footer={verseOfDay.reference}
            accentColor="#2E7D4F"
            onPress={() =>
              navigation.navigate('Quran', {
                surahNumber: verseOfDay.surahNumber,
                ayahNumber: verseOfDay.ayahNumber,
              })
            }
          />
        ) : null}

        {isLoadingDaily && !dailyContent ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.textMutedOnLight} />
            <Text style={styles.loadingText}>Günlük içerik yükleniyor...</Text>
          </View>
        ) : dailyError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{dailyError}</Text>
            <Pressable onPress={() => void loadDailyContent()} style={styles.retryButton}>
              <Text style={styles.retryText}>Tekrar dene</Text>
            </Pressable>
          </View>
        ) : dailyContent ? (
          <>
            <DailyContentCard
              emoji="🤲"
              title="Günün Duası"
              body={dailyContent.dua.text}
              footer={dailyContent.dua.reference}
              accentColor="#6B4C9A"
            />

            <DailyContentCard
              emoji="💎"
              title="Günün Hadisi"
              body={dailyContent.hadis.text}
              footer={dailyContent.hadis.reference}
              accentColor="#2E6B9E"
            />
          </>
        ) : null}

        <DailyContentCard
          emoji="🕌"
          title="Cuma Hutbesi"
          body={latestHutbe?.title ?? 'Diyanet Cuma hutbelerine göz at'}
          footer={
            latestHutbe ? formatHutbeDate(latestHutbe.date) : 'Hutbeler arşivini aç'
          }
          accentColor="#8B5A2B"
          onPress={() => navigation.navigate('Hutbeler')}
        />

        <DailyContentCard
          emoji="✨"
          title="Esmaül Hüsna"
          arabic={asmaOfDay.item.arabic}
          body={asmaOfDay.item.turkish}
          footer={asmaOfDay.item.name}
          accentColor={colors.gold}
          onPress={() =>
            navigation.navigate('AsmaUlHusna', {
              catalogIndex: asmaOfDay.catalogIndex,
            })
          }
        />

        <AdBanner inline />

        <HomeCompetitionSection />
        <HomeScoreStatusSection />
      </ScrollView>

      <View style={styles.bottomNavWrap}>
        <HomeBottomNav activeTab="home" onTabPress={handleTabPress} />
      </View>
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
    marginBottom: 2,
  },
  headerDate: {
    fontSize: 13,
    color: colors.creamMuted,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 24,
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: colors.textMutedOnLight,
  },
  errorBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  errorText: {
    fontSize: 14,
    color: colors.textMutedOnLight,
    marginBottom: 12,
  },
  retryButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.inputField,
  },
  retryText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.cream,
  },
  bottomNavWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});

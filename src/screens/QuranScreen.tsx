import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AyahCard from '../components/quran/AyahCard';
import QuranMiniPlayer from '../components/quran/QuranMiniPlayer';
import QuranNavigateSheet, {
  type QuranNavigateTarget,
} from '../components/quran/QuranNavigateSheet';
import SurahListRow from '../components/quran/SurahListRow';
import HomeBottomNav from '../components/HomeBottomNav';
import { getSurahNameTr } from '../constants/surahNamesTr';
import { QURAN_CONFIG } from '../config/quran';
import { useHomeTabNavigation } from '../hooks/useHomeTabNavigation';
import { useQuranPlayback } from '../hooks/useQuranPlayback';
import type { RootStackParamList } from '../navigation/types';
import { fetchSurahContent, fetchSurahList } from '../services/quranApi';
import { colors } from '../theme/colors';
import type { AyahWithTranslation, SurahContent, SurahMeta } from '../types/quran';

type ViewMode = 'list' | 'reader';
type QuranRoute = RouteProp<RootStackParamList, 'Quran'>;

export default function QuranScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<QuranRoute>();
  const handleTabPress = useHomeTabNavigation();
  const listRef = useRef<FlatList<AyahWithTranslation>>(null);
  const pendingScrollAyah = useRef<number | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [surahs, setSurahs] = useState<SurahMeta[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [navSheetVisible, setNavSheetVisible] = useState(false);

  const [selectedSurah, setSelectedSurah] = useState<SurahContent | null>(null);
  const [readingSurahNumber, setReadingSurahNumber] = useState<number | null>(null);
  const [isLoadingSurah, setIsLoadingSurah] = useState(false);
  const [surahError, setSurahError] = useState<string | null>(null);

  const playback = useQuranPlayback();

  const loadSurahList = useCallback(async () => {
    setIsLoadingList(true);
    setListError(null);
    try {
      const data = await fetchSurahList();
      setSurahs(data);
    } catch (error) {
      setListError(error instanceof Error ? error.message : 'Sure listesi yüklenemedi.');
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  useEffect(() => {
    void loadSurahList();
  }, [loadSurahList]);

  const openSurah = useCallback(
    async (surahNumber: number, ayahNumber = 1) => {
      const safeAyah = Math.max(1, Math.floor(Number(ayahNumber) || 1));
      setViewMode('reader');
      setReadingSurahNumber(surahNumber);
      setIsLoadingSurah(true);
      setSurahError(null);
      setSelectedSurah(null);
      pendingScrollAyah.current = safeAyah;
      await playback.stop();

      try {
        const content = await fetchSurahContent(surahNumber);
        setSelectedSurah(content);
      } catch (error) {
        setSurahError(error instanceof Error ? error.message : 'Sure yüklenemedi.');
        pendingScrollAyah.current = null;
      } finally {
        setIsLoadingSurah(false);
      }
    },
    [playback],
  );

  // Ana sayfa / deep link: params gelir gelmez sure+ayet aç
  useEffect(() => {
    const surahRaw = route.params?.surahNumber;
    if (surahRaw == null) return;
    const surahNumber = Number(surahRaw);
    if (!Number.isFinite(surahNumber) || surahNumber < 1) return;

    const ayahNumber = Math.max(1, Math.floor(Number(route.params?.ayahNumber ?? 1) || 1));
    navigation.setParams({ surahNumber: undefined, ayahNumber: undefined });
    void openSurah(surahNumber, ayahNumber);
  }, [route.params?.surahNumber, route.params?.ayahNumber, navigation, openSurah]);

  const goBackToList = useCallback(async () => {
    await playback.stop();
    setViewMode('list');
    setSelectedSurah(null);
    setReadingSurahNumber(null);
    setSurahError(null);
    pendingScrollAyah.current = null;
  }, [playback]);

  const handlePlaySurah = useCallback(async () => {
    if (!selectedSurah?.ayahs.length) return;
    await playback.playSurah(selectedSurah.ayahs, 0);
  }, [playback, selectedSurah]);

  const activeAyahIndex =
    selectedSurah?.ayahs.findIndex((a) => a.globalNumber === playback.activeGlobalAyah) ?? -1;

  useEffect(() => {
    if (activeAyahIndex >= 0 && pendingScrollAyah.current == null) {
      listRef.current?.scrollToIndex({ index: activeAyahIndex, animated: true, viewPosition: 0.3 });
    }
  }, [activeAyahIndex]);

  // FlatList mount + ölçü sonrası hedef ayete kaydır (yükseklik değişken olduğu için retry)
  useEffect(() => {
    if (!selectedSurah || isLoadingSurah) return;
    if (pendingScrollAyah.current == null) return;

    const targetIndex = Math.min(
      Math.max(0, pendingScrollAyah.current - 1),
      selectedSurah.ayahs.length - 1,
    );

    let cancelled = false;
    const delays = [50, 200, 450, 800];

    const tryScroll = (attempt: number) => {
      if (cancelled || !listRef.current) return;
      listRef.current.scrollToIndex({
        index: targetIndex,
        animated: attempt > 0,
        viewPosition: 0.15,
      });
      if (attempt >= delays.length - 1) {
        pendingScrollAyah.current = null;
      }
    };

    const timers = delays.map((ms, attempt) => setTimeout(() => tryScroll(attempt), ms));

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [selectedSurah, isLoadingSurah]);

  const handleNavigate = useCallback(
    (target: QuranNavigateTarget) => {
      void openSurah(target.surahNumber, target.ayahNumber);
    },
    [openSurah],
  );

  const surahTitle = selectedSurah
    ? getSurahNameTr(selectedSurah.number)
    : '';

  const playerAyahLabel =
    activeAyahIndex >= 0 && selectedSurah
      ? `Ayet ${selectedSurah.ayahs[activeAyahIndex]?.numberInSurah ?? ''}`
      : 'Dinleniyor...';

  const showPlayer = playback.activeGlobalAyah != null || playback.isLoading;

  const readerMetaAyah =
    activeAyahIndex >= 0 && selectedSurah
      ? selectedSurah.ayahs[activeAyahIndex]
      : selectedSurah?.ayahs[0];

  const readerHeaderDetail =
    readerMetaAyah != null
      ? `Sayfa ${readerMetaAyah.page} · Cüz ${readerMetaAyah.juz} · ${readerMetaAyah.numberInSurah}. ayet`
      : '';

  const currentAyahInReader =
    activeAyahIndex >= 0
      ? (selectedSurah?.ayahs[activeAyahIndex]?.numberInSurah ?? 1)
      : (selectedSurah?.ayahs[0]?.numberInSurah ?? 1);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        {viewMode === 'reader' ? (
          <Pressable
            onPress={() => void goBackToList()}
            style={styles.backButton}
            accessibilityLabel="Sure listesine dön"
          >
            <Ionicons name="chevron-back" size={24} color={colors.cream} />
          </Pressable>
        ) : (
          <Pressable
            onPress={() => setNavSheetVisible(true)}
            style={styles.headerActionButton}
            accessibilityLabel="Kuran ara"
          >
            <Ionicons name="search" size={22} color={colors.cream} />
          </Pressable>
        )}

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>
            {viewMode === 'list' ? 'Kuran-ı Kerim' : surahTitle}
          </Text>
          {viewMode === 'reader' && selectedSurah ? (
            <Text style={styles.headerSubtitle}>{readerHeaderDetail}</Text>
          ) : (
            <Text style={styles.headerSubtitle}>{QURAN_CONFIG.translationLabel} meal</Text>
          )}
        </View>

        {viewMode === 'reader' && selectedSurah ? (
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => setNavSheetVisible(true)}
              style={styles.headerActionButton}
              accessibilityLabel="Konuma git"
            >
              <Ionicons name="search" size={22} color={colors.cream} />
            </Pressable>
            <Pressable
              onPress={() => void handlePlaySurah()}
              style={styles.headerActionButton}
              accessibilityLabel="Sureyi baştan dinle"
            >
              <Ionicons name="headset-outline" size={22} color={colors.cream} />
            </Pressable>
          </View>
        ) : (
          <View style={styles.backPlaceholder} />
        )}
      </View>

      {viewMode === 'list' ? (
        <>
          {isLoadingList ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={colors.bar} />
              <Text style={styles.loadingText}>Sureler yükleniyor...</Text>
            </View>
          ) : listError ? (
            <View style={styles.centered}>
              <Text style={styles.errorText}>{listError}</Text>
              <Pressable onPress={() => void loadSurahList()} style={styles.retryButton}>
                <Text style={styles.retryText}>Tekrar dene</Text>
              </Pressable>
            </View>
          ) : (
            <FlatList
              data={surahs}
              keyExtractor={(item) => String(item.number)}
              renderItem={({ item }) => (
                <SurahListRow surah={item} onPress={() => void openSurah(item.number)} />
              )}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </>
      ) : (
        <>
          {isLoadingSurah ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={colors.bar} />
              <Text style={styles.loadingText}>Sure yükleniyor...</Text>
            </View>
          ) : surahError ? (
            <View style={styles.centered}>
              <Text style={styles.errorText}>{surahError}</Text>
              <Pressable
                onPress={() => readingSurahNumber && void openSurah(readingSurahNumber)}
                style={styles.retryButton}
              >
                <Text style={styles.retryText}>Tekrar dene</Text>
              </Pressable>
            </View>
          ) : selectedSurah ? (
            <FlatList
              ref={listRef}
              data={selectedSurah.ayahs}
              keyExtractor={(item) => String(item.globalNumber)}
              renderItem={({ item }) => (
                <AyahCard
                  ayah={item}
                  isActive={item.globalNumber === playback.activeGlobalAyah}
                  translationLabel={QURAN_CONFIG.translationLabel}
                  onPlayPress={() => void playback.playAyah(item)}
                />
              )}
              contentContainerStyle={[
                styles.listContent,
                showPlayer && styles.listContentWithPlayer,
              ]}
              showsVerticalScrollIndicator={false}
              onScrollToIndexFailed={(info) => {
                listRef.current?.scrollToOffset({
                  offset: Math.max(0, info.averageItemLength * info.index),
                  animated: false,
                });
                setTimeout(() => {
                  listRef.current?.scrollToIndex({
                    index: info.index,
                    animated: true,
                    viewPosition: 0.15,
                  });
                }, 320);
              }}
            />
          ) : null}
        </>
      )}

      {showPlayer && viewMode === 'reader' ? (
        <QuranMiniPlayer
          surahTitle={surahTitle}
          ayahLabel={playerAyahLabel}
          isPlaying={playback.isPlaying}
          isLoading={playback.isLoading}
          onTogglePlayPause={() => void playback.togglePlayPause()}
          onStop={() => void playback.stop()}
        />
      ) : null}

      <HomeBottomNav activeTab="quran" onTabPress={handleTabPress} />

      <QuranNavigateSheet
        visible={navSheetVisible}
        surahs={surahs}
        initialSurah={selectedSurah?.number ?? readingSurahNumber ?? 1}
        initialAyah={currentAyahInReader}
        onClose={() => setNavSheetVisible(false)}
        onNavigate={handleNavigate}
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
    paddingHorizontal: 8,
    paddingBottom: 14,
    backgroundColor: colors.bar,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.barBorder,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPlaceholder: {
    width: 44,
    height: 44,
  },
  playAllButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionButton: {
    width: 40,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.cream,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.creamMuted,
    marginTop: 2,
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  listContentWithPlayer: {
    paddingBottom: 8,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: colors.textMutedOnLight,
  },
  errorText: {
    fontSize: 15,
    color: colors.warning,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.bar,
  },
  retryText: {
    color: colors.cream,
    fontWeight: '600',
  },
});

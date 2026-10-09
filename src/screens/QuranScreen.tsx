import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewToken,
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
import {
  loadQuranReadingState,
  saveLastRead,
  toggleFavorite,
  type QuranFavorite,
  type QuranLastRead,
  type QuranReadingState,
} from '../services/quranReadingStorage';
import { colors } from '../theme/colors';
import type { AyahWithTranslation, SurahContent, SurahMeta } from '../types/quran';

type ViewMode = 'list' | 'reader';
type QuranRoute = RouteProp<RootStackParamList, 'Quran'>;

const VIEWABILITY_CONFIG = {
  itemVisiblePercentThreshold: 55,
  minimumViewTime: 400,
};

export default function QuranScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<QuranRoute>();
  const handleTabPress = useHomeTabNavigation();
  const listRef = useRef<FlatList<AyahWithTranslation>>(null);
  const pendingScrollAyah = useRef<number | null>(null);
  const readingSurahRef = useRef<number | null>(null);
  const lastSavedKeyRef = useRef<string>('');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [surahs, setSurahs] = useState<SurahMeta[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [navSheetVisible, setNavSheetVisible] = useState(false);

  const [selectedSurah, setSelectedSurah] = useState<SurahContent | null>(null);
  const [readingSurahNumber, setReadingSurahNumber] = useState<number | null>(null);
  const [isLoadingSurah, setIsLoadingSurah] = useState(false);
  const [surahError, setSurahError] = useState<string | null>(null);

  const [lastRead, setLastRead] = useState<QuranLastRead | null>(null);
  const [favorites, setFavorites] = useState<QuranFavorite[]>([]);

  const playback = useQuranPlayback();

  const favoriteKeys = useMemo(
    () => new Set(favorites.map((f) => `${f.surahNumber}:${f.ayahNumber}`)),
    [favorites],
  );

  const applyReadingState = useCallback((state: QuranReadingState) => {
    setLastRead(state.lastRead);
    setFavorites(state.favorites);
  }, []);

  const refreshReadingState = useCallback(async () => {
    applyReadingState(await loadQuranReadingState());
  }, [applyReadingState]);

  useEffect(() => {
    void refreshReadingState();
  }, [refreshReadingState]);

  useEffect(() => {
    readingSurahRef.current = readingSurahNumber;
  }, [readingSurahNumber]);

  const persistLastRead = useCallback(async (surahNumber: number, ayahNumber: number) => {
    const key = `${surahNumber}:${ayahNumber}`;
    if (lastSavedKeyRef.current === key) return;
    lastSavedKeyRef.current = key;
    await saveLastRead(surahNumber, ayahNumber);
    setLastRead({
      surahNumber,
      ayahNumber,
      updatedAt: new Date().toISOString(),
    });
  }, []);

  const scheduleLastRead = useCallback(
    (surahNumber: number, ayahNumber: number) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        void persistLastRead(surahNumber, ayahNumber);
      }, 500);
    },
    [persistLastRead],
  );
  const scheduleLastReadRef = useRef(scheduleLastRead);
  scheduleLastReadRef.current = scheduleLastRead;

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

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
      void persistLastRead(surahNumber, safeAyah);

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
    [playback, persistLastRead],
  );

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
    void refreshReadingState();
  }, [playback, refreshReadingState]);

  const handlePlaySurah = useCallback(async () => {
    if (!selectedSurah?.ayahs.length) return;
    await playback.playSurah(selectedSurah.ayahs, 0);
  }, [playback, selectedSurah]);

  const handleToggleFavorite = useCallback(
    async (ayah: AyahWithTranslation, surahNumber: number) => {
      const next = await toggleFavorite({
        surahNumber,
        ayahNumber: ayah.numberInSurah,
        globalNumber: ayah.globalNumber,
        snippet: ayah.translation,
      });
      applyReadingState(next);
    },
    [applyReadingState],
  );

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const first = viewableItems.find((v) => v.isViewable && v.item != null);
      if (!first?.item) return;
      const ayah = first.item as AyahWithTranslation;
      const surahNumber = readingSurahRef.current;
      if (surahNumber == null) return;
      scheduleLastReadRef.current(surahNumber, ayah.numberInSurah);
    },
  ).current;

  const activeAyahIndex =
    selectedSurah?.ayahs.findIndex((a) => a.globalNumber === playback.activeGlobalAyah) ?? -1;

  useEffect(() => {
    if (activeAyahIndex >= 0 && pendingScrollAyah.current == null) {
      listRef.current?.scrollToIndex({ index: activeAyahIndex, animated: true, viewPosition: 0.3 });
      if (selectedSurah) {
        const ayah = selectedSurah.ayahs[activeAyahIndex];
        if (ayah) scheduleLastRead(selectedSurah.number, ayah.numberInSurah);
      }
    }
  }, [activeAyahIndex, scheduleLastRead, selectedSurah]);

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

  const surahTitle = selectedSurah ? getSurahNameTr(selectedSurah.number) : '';

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

  const listHeader = (
    <View style={styles.listHeader}>
      {lastRead ? (
        <Pressable
          style={styles.continueCard}
          onPress={() => void openSurah(lastRead.surahNumber, lastRead.ayahNumber)}
          accessibilityRole="button"
          accessibilityLabel="Kaldığın yerden devam et"
        >
          <View style={styles.continueIcon}>
            <Ionicons name="bookmark" size={20} color={colors.gold} />
          </View>
          <View style={styles.continueText}>
            <Text style={styles.continueLabel}>Kaldığın yerden devam</Text>
            <Text style={styles.continueDetail}>
              {getSurahNameTr(lastRead.surahNumber)} · {lastRead.ayahNumber}. ayet
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.creamMuted} />
        </Pressable>
      ) : null}

      {favorites.length > 0 ? (
        <View style={styles.favoritesBlock}>
          <Text style={styles.sectionTitle}>Favoriler</Text>
          {favorites.map((fav) => (
            <Pressable
              key={`${fav.surahNumber}:${fav.ayahNumber}`}
              style={styles.favoriteRow}
              onPress={() => void openSurah(fav.surahNumber, fav.ayahNumber)}
              accessibilityRole="button"
              accessibilityLabel={`Favori ${getSurahNameTr(fav.surahNumber)} ${fav.ayahNumber}`}
            >
              <Ionicons name="star" size={16} color={colors.gold} />
              <View style={styles.favoriteText}>
                <Text style={styles.favoriteTitle}>
                  {getSurahNameTr(fav.surahNumber)} · {fav.ayahNumber}. ayet
                </Text>
                {fav.snippet ? (
                  <Text style={styles.favoriteSnippet} numberOfLines={2}>
                    {fav.snippet}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Sureler</Text>
    </View>
  );

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
              ListHeaderComponent={listHeader}
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
                  isFavorite={favoriteKeys.has(`${selectedSurah.number}:${item.numberInSurah}`)}
                  translationLabel={QURAN_CONFIG.translationLabel}
                  onPlayPress={() => void playback.playAyah(item)}
                  onToggleFavorite={() => void handleToggleFavorite(item, selectedSurah.number)}
                />
              )}
              contentContainerStyle={[
                styles.listContent,
                showPlayer && styles.listContentWithPlayer,
              ]}
              showsVerticalScrollIndicator={false}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={VIEWABILITY_CONFIG}
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
    paddingTop: 8,
    paddingBottom: 24,
  },
  listContentWithPlayer: {
    paddingBottom: 8,
  },
  listHeader: {
    paddingBottom: 8,
  },
  continueCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    marginTop: 8,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: colors.bar,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  continueIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.inputField,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueText: {
    flex: 1,
  },
  continueLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.cream,
  },
  continueDetail: {
    fontSize: 13,
    color: colors.creamMuted,
    marginTop: 2,
  },
  favoritesBlock: {
    marginBottom: 8,
  },
  sectionTitle: {
    marginHorizontal: 20,
    marginBottom: 10,
    marginTop: 4,
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMutedOnLight,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    opacity: 0.7,
  },
  favoriteRow: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#FFFDF6',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(2, 23, 52, 0.08)',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  favoriteText: {
    flex: 1,
  },
  favoriteTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textOnLight,
  },
  favoriteSnippet: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMutedOnLight,
    marginTop: 4,
    opacity: 0.85,
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

import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  PanResponder,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ASMAUL_HUSNA, type AsmaUlHusnaItem } from '../constants/asmaUlHusna';
import { useAsmaPlaylist } from '../hooks/useAsmaPlaylist';
import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';

const ARABIC_FONT = 'AmiriBold';

function AsmaCard({
  item,
  index,
  total,
  cardHeight,
  isActivePlaying,
  onPressCard,
  onShare,
}: {
  item: AsmaUlHusnaItem;
  index: number;
  total: number;
  cardHeight: number;
  isActivePlaying: boolean;
  onPressCard: () => void;
  onShare: (item: AsmaUlHusnaItem) => void;
}) {
  return (
    <View style={styles.pageInner}>
      <TouchableOpacity
        activeOpacity={0.92}
        delayPressIn={120}
        style={[styles.card, { height: cardHeight }, isActivePlaying && styles.cardPlaying]}
        onPress={onPressCard}
      >
        <Text style={styles.counter}>
          {index + 1} / {total}
        </Text>
        <Text style={styles.arabic}>{item.arabic}</Text>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.turkish}>{item.turkish}</Text>
        <Pressable
          style={styles.shareFab}
          onPress={() => onShare(item)}
          accessibilityLabel="Paylaş"
          hitSlop={12}
        >
          <Ionicons name="share-social-outline" size={20} color={colors.creamMuted} />
        </Pressable>
      </TouchableOpacity>
    </View>
  );
}

export default function AsmaUlHusnaScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'AsmaUlHusna'>>();
  const insets = useSafeAreaInsets();
  const playlist = useAsmaPlaylist();
  const listRef = useRef<FlatList<AsmaUlHusnaItem>>(null);
  const sliderTrackRef = useRef<View>(null);
  const pageHeightRef = useRef(0);
  const trackWidthRef = useRef(0);
  const trackPageXRef = useRef(0);
  const scrubRatioRef = useRef(0);
  const userScrollingRef = useRef(false);
  const suppressFollowUntilRef = useRef(0);
  const lastFollowedIndexRef = useRef(-1);
  const didInitialScrollRef = useRef(false);

  const [pageHeight, setPageHeight] = useState(0);
  const [scrubRatio, setScrubRatio] = useState<number | null>(null);

  const initialCatalogIndex = useMemo(() => {
    const raw = route.params?.catalogIndex;
    if (raw == null || Number.isNaN(raw)) return null;
    return Math.max(0, Math.min(raw, ASMAUL_HUSNA.length - 1));
  }, [route.params?.catalogIndex]);

  const cardHeight =
    pageHeight > 0 ? Math.min(Math.round(pageHeight * 0.72), Math.round(pageHeight - 24)) : 320;

  const scrollToCatalogIndex = useCallback((index: number, animated = true) => {
    const clamped = Math.max(0, Math.min(index, ASMAUL_HUSNA.length - 1));
    if (pageHeightRef.current <= 0) return;
    listRef.current?.scrollToIndex({
      index: clamped,
      animated,
    });
  }, []);

  // Ana sayfadan / menüden gelen isme git
  useEffect(() => {
    if (pageHeight <= 0 || didInitialScrollRef.current) return;
    if (initialCatalogIndex == null) {
      didInitialScrollRef.current = true;
      return;
    }
    didInitialScrollRef.current = true;
    lastFollowedIndexRef.current = initialCatalogIndex;
    suppressFollowUntilRef.current = Date.now() + 800;
    requestAnimationFrame(() => {
      scrollToCatalogIndex(initialCatalogIndex, false);
    });
  }, [initialCatalogIndex, pageHeight, scrollToCatalogIndex]);

  // Çalarken isim değişince kartı getir; kullanıcı kaydırıyorsa bozma
  useEffect(() => {
    if (!playlist.isPlaying) return;
    if (userScrollingRef.current) return;
    if (Date.now() < suppressFollowUntilRef.current) return;
    if (playlist.catalogIndex < 0) return;
    if (lastFollowedIndexRef.current === playlist.catalogIndex) return;
    lastFollowedIndexRef.current = playlist.catalogIndex;
    scrollToCatalogIndex(playlist.catalogIndex, true);
  }, [playlist.catalogIndex, playlist.isPlaying, scrollToCatalogIndex]);

  const onShare = useCallback(async (item: AsmaUlHusnaItem) => {
    await Share.share({
      message: `${item.arabic}\n${item.name}\n\n${item.turkish}`,
    });
  }, []);

  const playCardAtIndex = useCallback(
    async (catalogIndex: number) => {
      try {
        suppressFollowUntilRef.current = 0;
        lastFollowedIndexRef.current = catalogIndex;
        scrollToCatalogIndex(catalogIndex, true);
        await playlist.playFromCatalogIndex(catalogIndex);
      } catch {
        Alert.alert('Ses çalınamadı', 'Ses dosyası yüklenirken bir sorun oluştu.');
      }
    },
    [playlist, scrollToCatalogIndex],
  );

  const handleScrollBeginDrag = useCallback(() => {
    userScrollingRef.current = true;
    suppressFollowUntilRef.current = Date.now() + 2500;
  }, []);

  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      userScrollingRef.current = false;
      const height = pageHeightRef.current || 1;
      const index = Math.round(event.nativeEvent.contentOffset.y / height);
      // Ses değişmez; sadece takip referansını güncelle
      lastFollowedIndexRef.current = Math.max(0, Math.min(index, ASMAUL_HUSNA.length - 1));
    },
    [],
  );

  const handlePlayPress = useCallback(async () => {
    try {
      if (playlist.isPlaying) {
        await playlist.pause();
        return;
      }
      await playlist.play();
    } catch {
      try {
        await playlist.playFromCatalogIndex(playlist.catalogIndex >= 0 ? playlist.catalogIndex : 0);
      } catch {
        Alert.alert('Ses çalınamadı', 'Ses dosyası yüklenirken bir sorun oluştu.');
      }
    }
  }, [playlist]);

  const applySeekFromPageX = useCallback((pageX: number) => {
    const width = trackWidthRef.current;
    if (width <= 0) return;
    const ratio = Math.max(0, Math.min(1, (pageX - trackPageXRef.current) / width));
    scrubRatioRef.current = ratio;
    setScrubRatio(ratio);
  }, []);

  const commitSeek = useCallback(async () => {
    const ratio = scrubRatioRef.current;
    setScrubRatio(null);
    try {
      await playlist.seekGlobal(ratio);
      suppressFollowUntilRef.current = 0;
      lastFollowedIndexRef.current = -1;
    } catch {
      Alert.alert('Ses çalınamadı', 'Zaman çizelgesi kaydırılamadı.');
    }
  }, [playlist]);

  const sliderPan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (event) => {
          applySeekFromPageX(event.nativeEvent.pageX);
        },
        onPanResponderMove: (event) => {
          applySeekFromPageX(event.nativeEvent.pageX);
        },
        onPanResponderRelease: () => {
          void commitSeek();
        },
        onPanResponderTerminate: () => {
          void commitSeek();
        },
      }),
    [applySeekFromPageX, commitSeek],
  );

  const progress =
    scrubRatio != null
      ? scrubRatio
      : Math.max(0, Math.min(1, playlist.globalProgress));

  const headerShareItem = ASMAUL_HUSNA[playlist.catalogIndex] ?? ASMAUL_HUSNA[0];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
          accessibilityLabel="Geri"
        >
          <Ionicons name="chevron-back" size={24} color={colors.cream} />
        </Pressable>
        <Text style={styles.headerTitle}>Esmaül Hüsna</Text>
        <Pressable
          onPress={() => void onShare(headerShareItem)}
          style={styles.headerButton}
          accessibilityLabel="Paylaş"
        >
          <Ionicons name="share-outline" size={22} color={colors.cream} />
        </Pressable>
      </View>

      <View
        style={styles.listWrap}
        onLayout={(event) => {
          const next = Math.floor(event.nativeEvent.layout.height);
          if (next > 0 && Math.abs(next - pageHeightRef.current) > 1) {
            pageHeightRef.current = next;
            setPageHeight(next);
          }
        }}
      >
        {pageHeight > 0 ? (
          <FlatList
            ref={listRef}
            data={ASMAUL_HUSNA as AsmaUlHusnaItem[]}
            keyExtractor={(item) => item.mp}
            initialScrollIndex={initialCatalogIndex ?? 0}
            renderItem={({ item, index }) => (
              <View style={[styles.page, { height: pageHeight }]} collapsable={false}>
                <AsmaCard
                  item={item}
                  index={index}
                  total={ASMAUL_HUSNA.length}
                  cardHeight={cardHeight}
                  isActivePlaying={playlist.isPlaying && index === playlist.catalogIndex}
                  onPressCard={() => void playCardAtIndex(index)}
                  onShare={(shared) => void onShare(shared)}
                />
              </View>
            )}
            snapToInterval={pageHeight}
            snapToAlignment="start"
            disableIntervalMomentum={false}
            decelerationRate="normal"
            bounces
            showsVerticalScrollIndicator={false}
            onScrollBeginDrag={handleScrollBeginDrag}
            onMomentumScrollEnd={handleMomentumScrollEnd}
            onScrollToIndexFailed={(info) => {
              listRef.current?.scrollToOffset({
                offset: info.index * pageHeightRef.current,
                animated: true,
              });
            }}
            getItemLayout={(_, index) => ({
              length: pageHeight,
              offset: pageHeight * index,
              index,
            })}
            removeClippedSubviews={false}
          />
        ) : null}
      </View>

      <View style={[styles.player, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
        <Pressable
          style={styles.playButton}
          onPress={() => void handlePlayPress()}
          accessibilityLabel={playlist.isPlaying ? 'Duraklat' : 'Oynat'}
        >
          {playlist.isLoading ? (
            <ActivityIndicator color={colors.bar} />
          ) : (
            <Ionicons
              name={playlist.isPlaying ? 'pause' : 'play'}
              size={34}
              color={colors.bar}
              style={playlist.isPlaying ? undefined : styles.playIconOffset}
            />
          )}
        </Pressable>

        <View
          ref={sliderTrackRef}
          style={styles.sliderTrack}
          onLayout={() => {
            sliderTrackRef.current?.measureInWindow((x, _y, w) => {
              trackPageXRef.current = x;
              if (w > 0) trackWidthRef.current = w;
            });
          }}
          {...sliderPan.panHandlers}
        >
          <View style={styles.sliderFillBg} />
          <View style={[styles.sliderFill, { width: `${progress * 100}%` }]} />
          <View style={[styles.sliderThumb, { left: `${progress * 100}%` }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F1EC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 10,
    backgroundColor: colors.bar,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: colors.cream,
  },
  listWrap: {
    flex: 1,
  },
  page: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  pageInner: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: '#2C2C2C',
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 44,
    paddingBottom: 40,
    justifyContent: 'center',
    overflow: 'visible',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  cardPlaying: {
    borderColor: colors.gold,
  },
  counter: {
    position: 'absolute',
    top: 16,
    left: 18,
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '600',
  },
  arabic: {
    fontFamily: ARABIC_FONT,
    fontSize: 54,
    lineHeight: 104,
    color: colors.gold,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: 10,
    paddingTop: 10,
    paddingBottom: 6,
    includeFontPadding: true,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  turkish: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.82)',
    textAlign: 'center',
    paddingHorizontal: 6,
  },
  shareFab: {
    position: 'absolute',
    right: 16,
    bottom: 14,
    padding: 6,
    zIndex: 2,
  },
  player: {
    alignItems: 'center',
    paddingTop: 10,
    paddingHorizontal: 40,
    backgroundColor: '#F3F1EC',
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.gold,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  playIconOffset: {
    marginLeft: 3,
  },
  sliderTrack: {
    width: '100%',
    height: 36,
    justifyContent: 'center',
  },
  sliderFillBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(2, 23, 52, 0.15)',
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gold,
  },
  sliderThumb: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: colors.gold,
    marginLeft: -9,
  },
});

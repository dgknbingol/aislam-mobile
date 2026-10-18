import { Ionicons } from '@expo/vector-icons';
import { useEvent } from 'expo';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as ScreenOrientation from 'expo-screen-orientation';
import { StatusBar } from 'expo-status-bar';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';

/** SaudiQuranTv canlı HLS */
const KAABA_HLS_URL =
  'https://cdn-globecast.akamaized.net/live/eds/saudi_quran/hls_roku/index.m3u8';
const YOUTUBE_LIVE_URL = 'https://www.youtube.com/SaudiQuranTv/live';

function isLandscapeOrientation(orientation: ScreenOrientation.Orientation): boolean {
  return (
    orientation === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
    orientation === ScreenOrientation.Orientation.LANDSCAPE_RIGHT
  );
}

export default function KaabaLiveScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const videoViewRef = useRef<VideoView>(null);
  const [immersive, setImmersive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const player = useVideoPlayer(KAABA_HLS_URL, (instance) => {
    instance.loop = false;
    instance.play();
  });

  const { status } = useEvent(player, 'statusChange', { status: player.status });

  useEffect(() => {
    if (status === 'readyToPlay' || status === 'loading') {
      if (status === 'readyToPlay') {
        setLoading(false);
        setError(null);
      } else {
        setLoading(true);
      }
      return;
    }
    if (status === 'error') {
      setLoading(false);
      setError('Canlı yayın şu an açılamadı.');
    }
  }, [status]);

  useEffect(() => {
    void activateKeepAwakeAsync('kaaba-live');
    return () => {
      void deactivateKeepAwake('kaaba-live');
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      void ScreenOrientation.unlockAsync();

      const sub = ScreenOrientation.addOrientationChangeListener((event) => {
        setImmersive(isLandscapeOrientation(event.orientationInfo.orientation));
      });

      void ScreenOrientation.getOrientationAsync().then((orientation) => {
        setImmersive(isLandscapeOrientation(orientation));
      });

      return () => {
        ScreenOrientation.removeOrientationChangeListener(sub);
        setImmersive(false);
        void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      };
    }, []),
  );

  const exitImmersive = useCallback(() => {
    setImmersive(false);
    void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).then(() => {
      void ScreenOrientation.unlockAsync();
    });
  }, []);

  const retry = useCallback(() => {
    setError(null);
    setLoading(true);
    player.replace(KAABA_HLS_URL);
    player.play();
  }, [player]);

  const openYouTube = useCallback(() => {
    void Linking.openURL(YOUTUBE_LIVE_URL);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar hidden={immersive} style="light" />

      {!immersive ? (
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.iconButton}
            accessibilityLabel="Geri"
          >
            <Ionicons name="chevron-back" size={24} color={colors.cream} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Kâbe Canlı</Text>
            <Text style={styles.headerSubtitle}>Kesintisiz Kâbe canlı yayın</Text>
          </View>
          <Pressable onPress={retry} style={styles.iconButton} accessibilityLabel="Yenile">
            <Ionicons name="refresh-outline" size={22} color={colors.cream} />
          </Pressable>
        </View>
      ) : null}

      <View style={[styles.playerWrap, immersive && styles.playerWrapImmersive]}>
        {error ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={retry} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Tekrar dene</Text>
            </Pressable>
            <Pressable onPress={openYouTube} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>YouTube’da aç</Text>
            </Pressable>
          </View>
        ) : (
          <VideoView
            ref={videoViewRef}
            style={styles.video}
            player={player}
            contentFit="contain"
            nativeControls
            allowsFullscreen
            allowsPictureInPicture
            startsPictureInPictureAutomatically
            onFullscreenEnter={() => {
              setImmersive(true);
            }}
            onFullscreenExit={() => {
              exitImmersive();
            }}
          />
        )}

        {loading && !error ? (
          <View style={styles.loadingOverlay} pointerEvents="none">
            <ActivityIndicator size="large" color={colors.gold} />
            <Text style={styles.loadingText}>Yayın bağlanıyor…</Text>
          </View>
        ) : null}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.barBorder,
    backgroundColor: colors.bar,
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
    fontSize: 18,
    fontWeight: '700',
    color: colors.cream,
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: colors.creamMuted,
  },
  playerWrap: {
    flex: 1,
    backgroundColor: '#000',
  },
  playerWrapImmersive: {
    ...StyleSheet.absoluteFillObject,
  },
  video: {
    flex: 1,
    width: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    gap: 12,
  },
  loadingText: {
    color: colors.creamMuted,
    fontSize: 14,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: colors.background,
    gap: 12,
  },
  errorText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textOnLight,
    textAlign: 'center',
    marginBottom: 4,
  },
  primaryButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.bar,
  },
  primaryButtonText: {
    color: colors.cream,
    fontWeight: '600',
    fontSize: 14,
  },
  secondaryButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: colors.goldMuted,
    fontWeight: '600',
    fontSize: 14,
  },
});

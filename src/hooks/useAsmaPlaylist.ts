import { Audio, type AVPlaybackStatus } from 'expo-av';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ASMAUL_HUSNA, type AsmaUlHusnaItem } from '../constants/asmaUlHusna';
import { getAsmaAudioModuleForItem } from '../constants/asmaUlHusnaAudio';

export interface AsmaPlaylistState {
  isPlaying: boolean;
  isLoading: boolean;
  /** 0..1 tüm sesler boyunca */
  globalProgress: number;
  queueIndex: number;
  catalogIndex: number;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  togglePlayPause: () => Promise<void>;
  seekGlobal: (ratio: number) => Promise<void>;
  playFromCatalogIndex: (catalogIndex: number) => Promise<void>;
  stop: () => Promise<void>;
}

type Sound = Audio.Sound;

function buildPlaylist(): AsmaUlHusnaItem[] {
  return ASMAUL_HUSNA.filter((item) => item.hasAudio);
}

function catalogIndexOf(item: AsmaUlHusnaItem): number {
  return ASMAUL_HUSNA.findIndex((row) => row.mp === item.mp);
}

async function safeUnload(sound: Sound | null): Promise<void> {
  if (!sound) return;
  try {
    sound.setOnPlaybackStatusUpdate(null);
    const status = await sound.getStatusAsync();
    if (status.isLoaded) {
      try {
        await sound.stopAsync();
      } catch {
        // ignore
      }
      await sound.unloadAsync();
    }
  } catch {
    // ignore
  }
}

export function useAsmaPlaylist(): AsmaPlaylistState {
  const playlist = useMemo(() => buildPlaylist(), []);

  const currentRef = useRef<Sound | null>(null);
  const nextRef = useRef<Sound | null>(null);
  const nextIndexRef = useRef<number | null>(null);
  const preloadTokenRef = useRef(0);

  const queueIndexRef = useRef(0);
  const shouldContinueRef = useRef(false);
  const localProgressRef = useRef(0);
  /** Spam tıklamada sadece son istek geçerli olsun */
  const playGenRef = useRef(0);
  const playChainRef = useRef(Promise.resolve());
  const playQueueIndexRef = useRef<(index: number, seekRatioInTrack?: number) => Promise<void>>(
    async () => {},
  );

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [queueIndex, setQueueIndex] = useState(0);
  const [localProgress, setLocalProgress] = useState(0);

  const clearNext = useCallback(async () => {
    preloadTokenRef.current += 1;
    const pending = nextRef.current;
    nextRef.current = null;
    nextIndexRef.current = null;
    await safeUnload(pending);
  }, []);

  const unloadCurrent = useCallback(async () => {
    const current = currentRef.current;
    currentRef.current = null;
    await safeUnload(current);
  }, []);

  useEffect(() => {
    return () => {
      shouldContinueRef.current = false;
      playGenRef.current += 1;
      preloadTokenRef.current += 1;
      void safeUnload(currentRef.current);
      void safeUnload(nextRef.current);
      currentRef.current = null;
      nextRef.current = null;
    };
  }, []);

  /** Sonraki parçayı arka planda hazırla — geçişte bekleme olmasın */
  const preloadIndex = useCallback(
    async (index: number) => {
      if (index < 0 || index >= playlist.length) return;
      if (nextIndexRef.current === index && nextRef.current) return;

      const token = preloadTokenRef.current + 1;
      preloadTokenRef.current = token;

      const previous = nextRef.current;
      nextRef.current = null;
      nextIndexRef.current = null;
      void safeUnload(previous);

      const item = playlist[index];
      const moduleId = getAsmaAudioModuleForItem(item);
      if (moduleId == null) return;

      try {
        const { sound } = await Audio.Sound.createAsync(moduleId, {
          shouldPlay: false,
          volume: 1,
          progressUpdateIntervalMillis: 200,
        });

        if (token !== preloadTokenRef.current) {
          await safeUnload(sound);
          return;
        }

        nextRef.current = sound;
        nextIndexRef.current = index;
      } catch (error) {
        console.warn('[asma] preload failed', item.mp, error);
      }
    },
    [playlist],
  );

  const attachStatusListener = useCallback(
    (sound: Sound, index: number) => {
      sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (!status.isLoaded) return;

        const duration = status.durationMillis ?? 0;
        const ratio = duration > 0 ? status.positionMillis / duration : 0;
        localProgressRef.current = ratio;
        setLocalProgress(ratio);
        setIsPlaying(status.isPlaying);

        // Bitmeden ~1.2 sn önce bir sonraki parçayı kesin yükle
        if (
          status.isPlaying &&
          duration > 0 &&
          status.positionMillis >= Math.max(0, duration - 1200) &&
          nextIndexRef.current !== index + 1
        ) {
          void preloadIndex(index + 1);
        }

        if (status.didJustFinish && shouldContinueRef.current) {
          const nextIndex = index + 1;
          if (nextIndex < playlist.length) {
            void playQueueIndexRef.current(nextIndex, 0);
          } else {
            setIsPlaying(false);
            localProgressRef.current = 0;
            setLocalProgress(0);
          }
        }
      });
    },
    [playlist.length, preloadIndex],
  );

  const playQueueIndex = useCallback(
    (index: number, seekRatioInTrack = 0) => {
      const gen = ++playGenRef.current;

      const run = async () => {
        // Daha yeni bir istek geldiyse bu turu atla
        if (gen !== playGenRef.current) return;

        const item = playlist[index];
        if (!item) return;

        const moduleId = getAsmaAudioModuleForItem(item);
        if (moduleId == null) return;

        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        if (gen !== playGenRef.current) return;

        queueIndexRef.current = index;
        setQueueIndex(index);
        localProgressRef.current = seekRatioInTrack;
        setLocalProgress(seekRatioInTrack);

        const canUsePreload =
          seekRatioInTrack === 0 &&
          nextIndexRef.current === index &&
          nextRef.current != null;

        if (canUsePreload && nextRef.current) {
          const sound = nextRef.current;
          nextRef.current = null;
          nextIndexRef.current = null;

          const old = currentRef.current;
          currentRef.current = sound;
          void safeUnload(old);

          if (gen !== playGenRef.current) {
            await safeUnload(sound);
            if (currentRef.current === sound) currentRef.current = null;
            return;
          }

          attachStatusListener(sound, index);
          shouldContinueRef.current = true;
          await sound.playAsync();
          if (gen !== playGenRef.current) {
            await safeUnload(sound);
            if (currentRef.current === sound) currentRef.current = null;
            return;
          }
          setIsPlaying(true);
          setIsLoading(false);
          void preloadIndex(index + 1);
          return;
        }

        setIsLoading(true);
        try {
          await clearNext();
          if (gen !== playGenRef.current) return;
          await unloadCurrent();
          if (gen !== playGenRef.current) return;

          const created = await Audio.Sound.createAsync(moduleId, {
            shouldPlay: false,
            volume: 1,
            progressUpdateIntervalMillis: 200,
          });
          if (gen !== playGenRef.current) {
            await safeUnload(created.sound);
            return;
          }

          const sound = created.sound;
          currentRef.current = sound;

          if (seekRatioInTrack > 0) {
            const status = await sound.getStatusAsync();
            if (gen !== playGenRef.current) {
              await safeUnload(sound);
              if (currentRef.current === sound) currentRef.current = null;
              return;
            }
            if (status.isLoaded && status.durationMillis) {
              await sound.setPositionAsync(
                Math.min(
                  Math.max(0, status.durationMillis - 40),
                  status.durationMillis * seekRatioInTrack,
                ),
              );
            }
          }

          if (gen !== playGenRef.current) {
            await safeUnload(sound);
            if (currentRef.current === sound) currentRef.current = null;
            return;
          }

          attachStatusListener(sound, index);
          shouldContinueRef.current = true;
          await sound.playAsync();
          if (gen !== playGenRef.current) {
            await safeUnload(sound);
            if (currentRef.current === sound) currentRef.current = null;
            return;
          }
          setIsPlaying(true);
          void preloadIndex(index + 1);
        } catch (error) {
          if (gen === playGenRef.current) {
            console.warn('[asma] play failed', item.mp, error);
            setIsPlaying(false);
            throw error;
          }
        } finally {
          if (gen === playGenRef.current) {
            setIsLoading(false);
          }
        }
      };

      const queued = playChainRef.current.then(run, run);
      playChainRef.current = queued.then(
        () => undefined,
        () => undefined,
      );
      return queued;
    },
    [attachStatusListener, clearNext, playlist, preloadIndex, unloadCurrent],
  );

  playQueueIndexRef.current = playQueueIndex;

  // İlk parçayı açılışta önceden yükle
  useEffect(() => {
    void preloadIndex(0);
  }, [preloadIndex]);

  const play = useCallback(async () => {
    if (currentRef.current) {
      const status = await currentRef.current.getStatusAsync();
      if (status.isLoaded) {
        shouldContinueRef.current = true;
        await currentRef.current.playAsync();
        setIsPlaying(true);
        void preloadIndex(queueIndexRef.current + 1);
        return;
      }
    }
    await playQueueIndex(queueIndexRef.current, localProgressRef.current);
  }, [playQueueIndex, preloadIndex]);

  const pause = useCallback(async () => {
    shouldContinueRef.current = false;
    if (!currentRef.current) {
      setIsPlaying(false);
      return;
    }
    const status = await currentRef.current.getStatusAsync();
    if (status.isLoaded && status.isPlaying) {
      await currentRef.current.pauseAsync();
    }
    setIsPlaying(false);
  }, []);

  const togglePlayPause = useCallback(async () => {
    if (isPlaying) {
      await pause();
    } else {
      await play();
    }
  }, [isPlaying, pause, play]);

  const seekGlobal = useCallback(
    async (ratio: number) => {
      const clamped = Math.max(0, Math.min(0.999, ratio));
      const floatIndex = clamped * playlist.length;
      const nextQueue = Math.min(playlist.length - 1, Math.floor(floatIndex));
      const within = floatIndex - nextQueue;
      shouldContinueRef.current = true;
      await playQueueIndex(nextQueue, within);
    },
    [playQueueIndex, playlist.length],
  );

  const playFromCatalogIndex = useCallback(
    async (catalogIndex: number) => {
      const item = ASMAUL_HUSNA[catalogIndex];
      if (!item) return;

      if (!item.hasAudio) {
        await playQueueIndex(0, 0);
        return;
      }

      const qIndex = playlist.findIndex((row) => row.mp === item.mp);
      if (qIndex < 0) {
        await playQueueIndex(0, 0);
        return;
      }
      await playQueueIndex(qIndex, 0);
    },
    [playQueueIndex, playlist],
  );

  const stop = useCallback(async () => {
    shouldContinueRef.current = false;
    playGenRef.current += 1;
    await clearNext();
    await unloadCurrent();
    setIsPlaying(false);
    localProgressRef.current = 0;
    setLocalProgress(0);
  }, [clearNext, unloadCurrent]);

  const currentItem = playlist[queueIndex];
  const catalogIndex = currentItem ? catalogIndexOf(currentItem) : 0;
  const globalProgress =
    playlist.length > 0 ? (queueIndex + localProgress) / playlist.length : 0;

  return {
    isPlaying,
    isLoading,
    globalProgress,
    queueIndex,
    catalogIndex,
    play,
    pause,
    togglePlayPause,
    seekGlobal,
    playFromCatalogIndex,
    stop,
  };
}

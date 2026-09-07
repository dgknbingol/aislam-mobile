import { Audio, type AVPlaybackStatus } from 'expo-av';
import { useCallback, useEffect, useRef, useState } from 'react';

import { getAyahAudioUrl } from '../config/quran';
import type { AyahWithTranslation } from '../types/quran';

export interface QuranPlaybackState {
  isPlaying: boolean;
  isLoading: boolean;
  activeGlobalAyah: number | null;
  playAyah: (ayah: AyahWithTranslation) => Promise<void>;
  playSurah: (ayahs: AyahWithTranslation[], startIndex?: number) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  stop: () => Promise<void>;
}

export function useQuranPlayback(): QuranPlaybackState {
  const soundRef = useRef<Audio.Sound | null>(null);
  const queueRef = useRef<AyahWithTranslation[]>([]);
  const queueIndexRef = useRef(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeGlobalAyah, setActiveGlobalAyah] = useState<number | null>(null);

  const unloadSound = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
  }, []);

  const playQueueItem = useCallback(
    async (index: number) => {
      const ayah = queueRef.current[index];
      if (!ayah) {
        setIsPlaying(false);
        setActiveGlobalAyah(null);
        return;
      }

      queueIndexRef.current = index;
      setActiveGlobalAyah(ayah.globalNumber);
      setIsLoading(true);

      await unloadSound();

      const { sound } = await Audio.Sound.createAsync(
        { uri: getAyahAudioUrl(ayah.globalNumber) },
        { shouldPlay: true },
      );

      soundRef.current = sound;
      setIsLoading(false);
      setIsPlaying(true);

      sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (!status.isLoaded) return;

        if (status.didJustFinish) {
          void playQueueItem(index + 1);
        } else {
          setIsPlaying(status.isPlaying);
        }
      });
    },
    [unloadSound],
  );

  const playSurah = useCallback(
    async (ayahs: AyahWithTranslation[], startIndex = 0) => {
      queueRef.current = ayahs;
      await playQueueItem(startIndex);
    },
    [playQueueItem],
  );

  const playAyah = useCallback(
    async (ayah: AyahWithTranslation) => {
      await playSurah([ayah], 0);
    },
    [playSurah],
  );

  const stop = useCallback(async () => {
    queueRef.current = [];
    queueIndexRef.current = 0;
    setIsPlaying(false);
    setActiveGlobalAyah(null);
    await unloadSound();
  }, [unloadSound]);

  const togglePlayPause = useCallback(async () => {
    if (!soundRef.current) return;

    const status = await soundRef.current.getStatusAsync();
    if (!status.isLoaded) return;

    if (status.isPlaying) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
    } else {
      await soundRef.current.playAsync();
      setIsPlaying(true);
    }
  }, []);

  useEffect(() => {
    void Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });

    return () => {
      void unloadSound();
    };
  }, [unloadSound]);

  return {
    isPlaying,
    isLoading,
    activeGlobalAyah,
    playAyah,
    playSurah,
    togglePlayPause,
    stop,
  };
}

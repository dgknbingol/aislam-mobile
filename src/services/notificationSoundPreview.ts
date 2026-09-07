import { Audio } from 'expo-av';

import { getNotificationSoundOption } from '../constants/notificationSounds';

/** Seçim menüsünde uzun ezanı tam dinletmemek için kısa önizleme. */
const PREVIEW_MAX_MS = 6_000;

const SOUND_MODULES: Record<string, number> = {
  'ezan.wav': require('../../assets/sounds/ezan.wav'),
  'melody_1.wav': require('../../assets/sounds/melody_1.wav'),
  'melody_2.wav': require('../../assets/sounds/melody_2.wav'),
  'melody_3.wav': require('../../assets/sounds/melody_3.wav'),
  'notification1.mp3': require('../../assets/sounds/notification1.mp3'),
  'notification2.mp3': require('../../assets/sounds/notification2.mp3'),
  'notification3.mp3': require('../../assets/sounds/notification3.mp3'),
  'notification4.mp3': require('../../assets/sounds/notification4.mp3'),
  'notification5.mp3': require('../../assets/sounds/notification5.mp3'),
  'notification6.mp3': require('../../assets/sounds/notification6.mp3'),
  'notification7.mp3': require('../../assets/sounds/notification7.mp3'),
};

let currentSound: Audio.Sound | null = null;
let stopTimer: ReturnType<typeof setTimeout> | null = null;

export async function stopNotificationSoundPreview(): Promise<void> {
  if (stopTimer) {
    clearTimeout(stopTimer);
    stopTimer = null;
  }
  if (currentSound) {
    try {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
    } catch {
      // ignore unload races
    }
    currentSound = null;
  }
}

/** Ayarlar picker'da seçime basınca kısa ses önizlemesi. Varsayılan = sistem sesi, önizleme yok. */
export async function previewNotificationSound(index: number): Promise<void> {
  await stopNotificationSoundPreview();

  const option = getNotificationSoundOption(index);
  if (option.kind === 'default') return;

  const source = SOUND_MODULES[option.fileName];
  if (source == null) return;

  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    const { sound } = await Audio.Sound.createAsync(source, { shouldPlay: true, volume: 1 });
    currentSound = sound;

    stopTimer = setTimeout(() => {
      void stopNotificationSoundPreview();
    }, PREVIEW_MAX_MS);

    sound.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded) return;
      if (status.didJustFinish) {
        void stopNotificationSoundPreview();
      }
    });
  } catch {
    await stopNotificationSoundPreview();
  }
}

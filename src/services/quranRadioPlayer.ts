import { Audio, type AVPlaybackStatus } from 'expo-av';

const STREAM_URL = 'https://backup.qurango.net/radio/mix';

export type QuranRadioState = {
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
};

type Listener = (state: QuranRadioState) => void;

let sound: Audio.Sound | null = null;
let state: QuranRadioState = {
  isPlaying: false,
  isLoading: false,
  error: null,
};
const listeners = new Set<Listener>();

function emit() {
  const snapshot = { ...state };
  listeners.forEach((listener) => listener(snapshot));
}

function setState(partial: Partial<QuranRadioState>) {
  state = { ...state, ...partial };
  emit();
}

function onStatus(status: AVPlaybackStatus) {
  if (!status.isLoaded) {
    if (status.error) {
      setState({
        isPlaying: false,
        isLoading: false,
        error: 'Radyo yayını bağlanamadı.',
      });
    }
    return;
  }
  setState({
    isPlaying: status.isPlaying,
    isLoading: false,
    error: null,
  });
}

export function getQuranRadioState(): QuranRadioState {
  return { ...state };
}

export function subscribeQuranRadio(listener: Listener): () => void {
  listeners.add(listener);
  listener({ ...state });
  return () => {
    listeners.delete(listener);
  };
}

export async function startQuranRadio(): Promise<void> {
  setState({ isLoading: true, error: null });
  try {
    if (sound) {
      await sound.unloadAsync();
      sound = null;
    }

    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    const created = await Audio.Sound.createAsync(
      { uri: STREAM_URL },
      { shouldPlay: true, isLooping: false },
      onStatus,
    );
    sound = created.sound;
  } catch {
    sound = null;
    setState({
      isPlaying: false,
      isLoading: false,
      error: 'Radyo yayını bağlanamadı.',
    });
  }
}

export async function toggleQuranRadio(): Promise<void> {
  if (!sound) {
    await startQuranRadio();
    return;
  }

  const status = await sound.getStatusAsync();
  if (!status.isLoaded) {
    await startQuranRadio();
    return;
  }

  if (status.isPlaying) {
    await sound.pauseAsync();
    setState({ isPlaying: false });
  } else {
    await sound.playAsync();
    setState({ isPlaying: true });
  }
}

export async function stopQuranRadio(): Promise<void> {
  if (sound) {
    try {
      await sound.stopAsync();
      await sound.unloadAsync();
    } catch {
      // ignore
    }
    sound = null;
  }
  setState({ isPlaying: false, isLoading: false, error: null });
}

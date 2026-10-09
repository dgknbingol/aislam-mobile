import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@aislam/quran/reading';

export type QuranLastRead = {
  surahNumber: number;
  ayahNumber: number;
  updatedAt: string;
};

export type QuranFavorite = {
  surahNumber: number;
  ayahNumber: number;
  globalNumber: number;
  /** Kısa meal özeti (liste için). */
  snippet: string;
  savedAt: string;
};

export type QuranReadingState = {
  lastRead: QuranLastRead | null;
  favorites: QuranFavorite[];
};

const EMPTY: QuranReadingState = {
  lastRead: null,
  favorites: [],
};

let memoryCache: QuranReadingState | null = null;

function favoriteKey(surahNumber: number, ayahNumber: number): string {
  return `${surahNumber}:${ayahNumber}`;
}

function sanitize(raw: unknown): QuranReadingState {
  if (!raw || typeof raw !== 'object') return { ...EMPTY, favorites: [] };

  const data = raw as Partial<QuranReadingState>;
  let lastRead: QuranLastRead | null = null;
  if (data.lastRead && typeof data.lastRead === 'object') {
    const lr = data.lastRead;
    const surahNumber = Number(lr.surahNumber);
    const ayahNumber = Number(lr.ayahNumber);
    if (
      Number.isFinite(surahNumber) &&
      surahNumber >= 1 &&
      surahNumber <= 114 &&
      Number.isFinite(ayahNumber) &&
      ayahNumber >= 1
    ) {
      lastRead = {
        surahNumber,
        ayahNumber,
        updatedAt: typeof lr.updatedAt === 'string' ? lr.updatedAt : new Date().toISOString(),
      };
    }
  }

  const favorites: QuranFavorite[] = [];
  if (Array.isArray(data.favorites)) {
    for (const item of data.favorites) {
      if (!item || typeof item !== 'object') continue;
      const surahNumber = Number(item.surahNumber);
      const ayahNumber = Number(item.ayahNumber);
      const globalNumber = Number(item.globalNumber);
      if (
        !Number.isFinite(surahNumber) ||
        surahNumber < 1 ||
        !Number.isFinite(ayahNumber) ||
        ayahNumber < 1
      ) {
        continue;
      }
      favorites.push({
        surahNumber,
        ayahNumber,
        globalNumber: Number.isFinite(globalNumber) ? globalNumber : 0,
        snippet: typeof item.snippet === 'string' ? item.snippet.slice(0, 120) : '',
        savedAt: typeof item.savedAt === 'string' ? item.savedAt : new Date().toISOString(),
      });
    }
  }

  return { lastRead, favorites };
}

async function persist(state: QuranReadingState): Promise<void> {
  memoryCache = state;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export async function loadQuranReadingState(): Promise<QuranReadingState> {
  if (memoryCache) return memoryCache;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      memoryCache = { ...EMPTY, favorites: [] };
      return memoryCache;
    }
    memoryCache = sanitize(JSON.parse(raw) as unknown);
    return memoryCache;
  } catch {
    memoryCache = { ...EMPTY, favorites: [] };
    return memoryCache;
  }
}

export async function saveLastRead(surahNumber: number, ayahNumber: number): Promise<void> {
  const state = await loadQuranReadingState();
  const next: QuranReadingState = {
    ...state,
    lastRead: {
      surahNumber,
      ayahNumber,
      updatedAt: new Date().toISOString(),
    },
  };
  await persist(next);
}

export function isFavoriteInState(
  state: QuranReadingState,
  surahNumber: number,
  ayahNumber: number,
): boolean {
  const key = favoriteKey(surahNumber, ayahNumber);
  return state.favorites.some((f) => favoriteKey(f.surahNumber, f.ayahNumber) === key);
}

export async function toggleFavorite(input: {
  surahNumber: number;
  ayahNumber: number;
  globalNumber: number;
  snippet: string;
}): Promise<QuranReadingState> {
  const state = await loadQuranReadingState();
  const key = favoriteKey(input.surahNumber, input.ayahNumber);
  const exists = state.favorites.some((f) => favoriteKey(f.surahNumber, f.ayahNumber) === key);

  const favorites = exists
    ? state.favorites.filter((f) => favoriteKey(f.surahNumber, f.ayahNumber) !== key)
    : [
        {
          surahNumber: input.surahNumber,
          ayahNumber: input.ayahNumber,
          globalNumber: input.globalNumber,
          snippet: input.snippet.trim().slice(0, 120),
          savedAt: new Date().toISOString(),
        },
        ...state.favorites,
      ];

  const next = { ...state, favorites };
  await persist(next);
  return next;
}

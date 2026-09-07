import AsyncStorage from '@react-native-async-storage/async-storage';

import { AI_CONFIG } from '../config/ai';

export interface DailyItem {
  text: string;
  reference: string;
}

export interface DailyContentResponse {
  date: string;
  ayet: DailyItem;
  dua: DailyItem;
  hadis: DailyItem;
}

interface ApiErrorResponse {
  message?: string;
  code?: string;
}

const DAILY_CACHE_KEY = '@aislam/daily-content';

let memoryCache: DailyContentResponse | null = null;
let memoryCacheDate: string | null = null;

function todayDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

async function persistDailyCache(content: DailyContentResponse): Promise<void> {
  memoryCache = content;
  memoryCacheDate = todayDateKey();
  await AsyncStorage.setItem(
    DAILY_CACHE_KEY,
    JSON.stringify({ date: memoryCacheDate, content }),
  );
}

export async function getCachedDailyContent(): Promise<DailyContentResponse | null> {
  const today = todayDateKey();
  if (memoryCache && memoryCacheDate === today) {
    return memoryCache;
  }

  const raw = await AsyncStorage.getItem(DAILY_CACHE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as { date: string; content: DailyContentResponse };
    if (parsed.date !== today || !parsed.content?.ayet?.text) {
      return null;
    }
    memoryCache = parsed.content;
    memoryCacheDate = today;
    return parsed.content;
  } catch {
    return null;
  }
}

async function fetchDailyContentFromNetwork(): Promise<DailyContentResponse> {
  const url = `${AI_CONFIG.ragBaseUrl.replace(/\/$/, '')}/api/daily/today`;

  const response = await fetch(url, {
    headers: {
      'ngrok-skip-browser-warning': 'true',
    },
  });

  let data: DailyContentResponse | ApiErrorResponse | null = null;
  try {
    data = (await response.json()) as DailyContentResponse | ApiErrorResponse;
  } catch {
    // JSON olmayan hata gövdesi
  }

  if (!response.ok) {
    const err = data as ApiErrorResponse | null;
    throw new Error(err?.message ?? `Sunucu hatası (${response.status})`);
  }

  const content = data as DailyContentResponse | null;
  if (!content?.ayet?.text || !content.dua?.text || !content.hadis?.text) {
    throw new Error('Günlük içerik alınamadı.');
  }

  await persistDailyCache(content);
  return content;
}

export async function fetchDailyContent(): Promise<DailyContentResponse> {
  const cached = await getCachedDailyContent();
  if (cached) {
    void fetchDailyContentFromNetwork().catch(() => {});
    return cached;
  }
  return fetchDailyContentFromNetwork();
}

import AsyncStorage from '@react-native-async-storage/async-storage';

import { QURAN_CONFIG } from '../config/quran';
import { getSurahNameTr } from '../constants/surahNamesTr';

/** Mushaf toplam ayet sayısı (AlQuran Cloud). */
const TOTAL_AYAHS = 6236;
const CACHE_KEY = '@aislam/verse-of-day';

export interface VerseOfDay {
  dateKey: string;
  surahNumber: number;
  ayahNumber: number;
  globalNumber: number;
  translation: string;
  /** Örn. "Zümer 39:53" */
  reference: string;
}

interface ApiResponse<T> {
  code: number;
  status: string;
  data: T;
}

interface ApiAyahEdition {
  number: number;
  text: string;
  numberInSurah: number;
  surah: { number: number };
  edition?: { identifier: string };
}

function todayDateKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Aynı gün aynı ayet; gün değişince (pseudo) rastgele başka ayet. */
function pickGlobalAyahForDate(dateKey: string): number {
  let hash = 0;
  for (let i = 0; i < dateKey.length; i += 1) {
    hash = (hash * 31 + dateKey.charCodeAt(i)) >>> 0;
  }
  return (hash % TOTAL_AYAHS) + 1;
}

function formatReference(surahNumber: number, ayahNumber: number): string {
  return `${getSurahNameTr(surahNumber)} ${surahNumber}:${ayahNumber}`;
}

async function fetchAyahByGlobalNumber(globalNumber: number): Promise<VerseOfDay> {
  const { apiBaseUrl, arabicEdition, translationEdition } = QURAN_CONFIG;
  const url = `${apiBaseUrl}/ayah/${globalNumber}/editions/${arabicEdition},${translationEdition}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Ayet alınamadı (${response.status})`);
  }

  const body = (await response.json()) as ApiResponse<ApiAyahEdition[]>;
  if (body.code !== 200 || !Array.isArray(body.data) || body.data.length === 0) {
    throw new Error('Ayet alınamadı.');
  }

  const arabic = body.data.find((item) => item.edition?.identifier === arabicEdition) ?? body.data[0];
  const translation =
    body.data.find((item) => item.edition?.identifier === translationEdition) ?? body.data[1];

  const surahNumber = arabic.surah.number;
  const ayahNumber = arabic.numberInSurah;
  const text = (translation?.text ?? '').replace(/^\uFEFF/, '').trim();
  if (!text) {
    throw new Error('Ayet mealı alınamadı.');
  }

  return {
    dateKey: todayDateKey(),
    surahNumber,
    ayahNumber,
    globalNumber: arabic.number,
    translation: text,
    reference: formatReference(surahNumber, ayahNumber),
  };
}

export async function getCachedVerseOfDay(): Promise<VerseOfDay | null> {
  const today = todayDateKey();
  const raw = await AsyncStorage.getItem(CACHE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as VerseOfDay;
    if (parsed.dateKey !== today || !parsed.translation || !parsed.surahNumber) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function getVerseOfDay(): Promise<VerseOfDay> {
  const cached = await getCachedVerseOfDay();
  if (cached) return cached;

  const globalNumber = pickGlobalAyahForDate(todayDateKey());
  const verse = await fetchAyahByGlobalNumber(globalNumber);
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(verse));
  return verse;
}

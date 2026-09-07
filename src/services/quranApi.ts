import { QURAN_CONFIG } from '../config/quran';
import type { SurahContent, SurahMeta } from '../types/quran';

interface ApiResponse<T> {
  code: number;
  status: string;
  data: T;
}

interface ApiAyah {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  page: number;
}

interface ApiEditionMeta {
  identifier: string;
}

interface ApiSurahEdition {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: 'Meccan' | 'Medinan';
  numberOfAyahs: number;
  ayahs: ApiAyah[];
  edition?: ApiEditionMeta;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Kuran verisi alınamadı (${response.status})`);
  }

  const body = (await response.json()) as ApiResponse<T>;
  if (body.code !== 200 || !body.data) {
    throw new Error('Kuran verisi alınamadı.');
  }

  return body.data;
}

export async function fetchSurahList(): Promise<SurahMeta[]> {
  const { apiBaseUrl } = QURAN_CONFIG;
  return fetchJson<SurahMeta[]>(`${apiBaseUrl}/surah`);
}

interface ApiAyahWithSurah extends ApiAyah {
  surah?: { number: number };
}

interface ApiPageData {
  number: number;
  ayahs: ApiAyahWithSurah[];
}

export interface QuranLocation {
  surahNumber: number;
  ayahNumber: number;
}

export async function fetchSurahContent(
  surahNumber: number,
  translationEdition: string = QURAN_CONFIG.translationEdition,
): Promise<SurahContent> {
  const { apiBaseUrl, arabicEdition } = QURAN_CONFIG;
  const url = `${apiBaseUrl}/surah/${surahNumber}/editions/${arabicEdition},${translationEdition}`;
  const editions = await fetchJson<ApiSurahEdition[]>(url);

  const arabic = editions.find((e) => e.edition?.identifier === arabicEdition) ?? editions[0];
  const translation =
    editions.find((e) => e.edition?.identifier === translationEdition) ?? editions[1];

  if (!arabic?.ayahs?.length || !translation?.ayahs?.length) {
    throw new Error('Sure içeriği yüklenemedi.');
  }

  const translationByAyah = new Map(
    translation.ayahs.map((ayah) => [ayah.numberInSurah, ayah.text.replace(/^\uFEFF/, '').trim()]),
  );

  const ayahs = arabic.ayahs.map((ayah) => ({
    numberInSurah: ayah.numberInSurah,
    globalNumber: ayah.number,
    arabic: ayah.text.replace(/^\uFEFF/, '').trim(),
    translation: translationByAyah.get(ayah.numberInSurah) ?? '',
    juz: ayah.juz,
    page: ayah.page,
  }));

  return {
    number: arabic.number,
    name: arabic.name,
    englishName: arabic.englishName,
    englishNameTranslation: arabic.englishNameTranslation,
    revelationType: arabic.revelationType,
    numberOfAyahs: arabic.numberOfAyahs,
    ayahs,
  };
}

export async function resolvePageLocation(pageNumber: number): Promise<QuranLocation> {
  const { apiBaseUrl, arabicEdition } = QURAN_CONFIG;
  const data = await fetchJson<ApiPageData>(
    `${apiBaseUrl}/page/${pageNumber}/${arabicEdition}`,
  );
  const first = data.ayahs[0];
  if (!first?.surah?.number) {
    throw new Error('Sayfa konumu bulunamadı.');
  }
  return { surahNumber: first.surah.number, ayahNumber: first.numberInSurah };
}

export async function resolveJuzLocation(juzNumber: number): Promise<QuranLocation> {
  const { apiBaseUrl, arabicEdition } = QURAN_CONFIG;
  const data = await fetchJson<ApiPageData>(
    `${apiBaseUrl}/juz/${juzNumber}/${arabicEdition}`,
  );
  const first = data.ayahs[0];
  if (!first?.surah?.number) {
    throw new Error('Cüz konumu bulunamadı.');
  }
  return { surahNumber: first.surah.number, ayahNumber: first.numberInSurah };
}

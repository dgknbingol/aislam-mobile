import AsyncStorage from '@react-native-async-storage/async-storage';

export interface HutbeItem {
  id: string;
  title: string;
  date: string;
  year: number;
  pdfUrl: string;
  sourcePdfUrl?: string;
}

const HUTBE_CACHE_KEY = '@aislam/hutbes-tr';

let memoryCache: HutbeItem[] | null = null;

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

export function normalizeHutbeTitle(title: string): string {
  return decodeHtmlEntities(title).trim();
}

export function formatHutbeDate(dateIso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateIso);
  if (!match) return dateIso;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export async function getCachedHutbes(): Promise<HutbeItem[]> {
  if (memoryCache) return memoryCache;

  const raw = await AsyncStorage.getItem(HUTBE_CACHE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as HutbeItem[];
    if (!Array.isArray(parsed)) return [];
    memoryCache = parsed;
    return parsed;
  } catch {
    return [];
  }
}

export async function saveHutbes(items: HutbeItem[]): Promise<void> {
  const sorted = [...items].sort((a, b) => b.date.localeCompare(a.date));
  memoryCache = sorted;
  await AsyncStorage.setItem(HUTBE_CACHE_KEY, JSON.stringify(sorted));
}

/** Yeni hutbeleri mevcut arşive ekler; aynı id tekrar yazılmaz. */
export async function mergeHutbes(incoming: HutbeItem[]): Promise<HutbeItem[]> {
  const existing = await getCachedHutbes();
  const byId = new Map(existing.map((item) => [item.id, item]));

  for (const item of incoming) {
    byId.set(item.id, {
      ...item,
      title: normalizeHutbeTitle(item.title),
    });
  }

  const merged = Array.from(byId.values());
  await saveHutbes(merged);
  return merged;
}

export async function getHutbeById(id: string): Promise<HutbeItem | null> {
  const items = await getCachedHutbes();
  return items.find((item) => item.id === id) ?? null;
}

export async function getLatestHutbe(): Promise<HutbeItem | null> {
  const items = await getCachedHutbes();
  return items[0] ?? null;
}

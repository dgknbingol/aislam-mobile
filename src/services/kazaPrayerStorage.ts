import AsyncStorage from '@react-native-async-storage/async-storage';

export type KazaPrayerId = 'sabah' | 'ogle' | 'ikindi' | 'aksam' | 'yatsi' | 'vitir' | 'oruc';

export type KazaPrayerCounts = Record<KazaPrayerId, number>;

export type KazaPrayerRecord = {
  counts: KazaPrayerCounts;
  updatedAt: string | null;
};

const STORAGE_KEY = '@aislam/kaza-prayers';

export const KAZA_PRAYER_ORDER: KazaPrayerId[] = [
  'sabah',
  'ogle',
  'ikindi',
  'aksam',
  'yatsi',
  'vitir',
  'oruc',
];

export const KAZA_NAMAZ_ORDER: KazaPrayerId[] = [
  'sabah',
  'ogle',
  'ikindi',
  'aksam',
  'yatsi',
  'vitir',
];

export const KAZA_PRAYER_LABELS: Record<KazaPrayerId, string> = {
  sabah: 'Sabah',
  ogle: 'Öğle',
  ikindi: 'İkindi',
  aksam: 'Akşam',
  yatsi: 'Yatsı',
  vitir: 'Vitir',
  oruc: 'Oruç',
};

const EMPTY_COUNTS: KazaPrayerCounts = {
  sabah: 0,
  ogle: 0,
  ikindi: 0,
  aksam: 0,
  yatsi: 0,
  vitir: 0,
  oruc: 0,
};

function sanitizeCounts(raw: Partial<KazaPrayerCounts> | undefined): KazaPrayerCounts {
  const next = { ...EMPTY_COUNTS };
  for (const id of KAZA_PRAYER_ORDER) {
    const value = raw?.[id];
    next[id] = typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
  }
  return next;
}

export async function loadKazaPrayerRecord(): Promise<KazaPrayerRecord> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { counts: { ...EMPTY_COUNTS }, updatedAt: null };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<KazaPrayerRecord>;
    return {
      counts: sanitizeCounts(parsed.counts),
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : null,
    };
  } catch {
    return { counts: { ...EMPTY_COUNTS }, updatedAt: null };
  }
}

export async function saveKazaPrayerRecord(record: KazaPrayerRecord): Promise<void> {
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      counts: sanitizeCounts(record.counts),
      updatedAt: record.updatedAt,
    }),
  );
}

export function getKazaNamazTotal(counts: KazaPrayerCounts): number {
  return KAZA_NAMAZ_ORDER.reduce((sum, id) => sum + counts[id], 0);
}

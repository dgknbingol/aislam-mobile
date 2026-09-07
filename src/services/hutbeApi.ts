import {
  getCachedHutbes,
  mergeHutbes,
  type HutbeItem,
} from './hutbeStorage';

const OPEN_HUTBE_JSON_URL =
  'https://raw.githubusercontent.com/TalhaY61/open-hutbe-api/main/hutbes.json';

interface OpenHutbeEntry {
  id?: string;
  title?: string;
  date?: string;
  year?: number;
  language?: string;
  pdf_url?: string;
  source_pdf_url?: string;
}

function mapEntry(entry: OpenHutbeEntry): HutbeItem | null {
  if (!entry.id || !entry.title || !entry.date) return null;
  const pdfUrl = entry.pdf_url || entry.source_pdf_url;
  if (!pdfUrl) return null;

  const year =
    typeof entry.year === 'number'
      ? entry.year
      : Number(entry.date.slice(0, 4)) || new Date().getFullYear();

  return {
    id: entry.id,
    title: entry.title,
    date: entry.date,
    year,
    pdfUrl,
    sourcePdfUrl: entry.source_pdf_url,
  };
}

async function fetchHutbesFromNetwork(): Promise<HutbeItem[]> {
  const response = await fetch(OPEN_HUTBE_JSON_URL, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Hutbe listesi alınamadı (${response.status})`);
  }

  const data = (await response.json()) as OpenHutbeEntry[];
  if (!Array.isArray(data)) {
    throw new Error('Hutbe listesi beklenen formatta değil');
  }

  return data
    .filter((entry) => entry.language === 'tr')
    .map(mapEntry)
    .filter((item): item is HutbeItem => item != null);
}

/**
 * Ağdan Türkçe hutbeleri çeker, yerel arşive kaydeder.
 * Ağ hatasında önbellekteki listeyi döner (boşsa hata fırlatır).
 */
export async function syncHutbes(): Promise<HutbeItem[]> {
  try {
    const remote = await fetchHutbesFromNetwork();
    return mergeHutbes(remote);
  } catch (error) {
    const cached = await getCachedHutbes();
    if (cached.length > 0) return cached;
    throw error instanceof Error ? error : new Error('Hutbeler yüklenemedi');
  }
}

export async function loadHutbes(preferCacheFirst = true): Promise<HutbeItem[]> {
  if (preferCacheFirst) {
    const cached = await getCachedHutbes();
    if (cached.length > 0) {
      void syncHutbes().catch(() => undefined);
      return cached;
    }
  }
  return syncHutbes();
}

import { calculateDistanceKm } from '../utils/geo';

export type NearbyMosque = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
};

type OverpassElement = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

type OverpassResponse = {
  elements?: OverpassElement[];
};

/** overpass-api.de bazen 406/429/timeout verir — paralel dene, ilk başarılı yeter. */
const OVERPASS_ENDPOINTS = [
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass.osm.ch/api/interpreter',
  'https://overpass-api.de/api/interpreter',
] as const;

const SEARCH_RADIUS_METERS = 4000;
const MAX_RESULTS = 30;
const FETCH_TIMEOUT_MS = 12_000;

function buildQuery(latitude: number, longitude: number): string {
  const around = `${SEARCH_RADIUS_METERS},${latitude},${longitude}`;
  // Daha dar sorgu — Overpass daha hızlı döner
  return `
    [out:json][timeout:10];
    (
      node["amenity"="place_of_worship"]["religion"="muslim"](around:${around});
      way["amenity"="place_of_worship"]["religion"="muslim"](around:${around});
      node["building"="mosque"](around:${around});
      way["building"="mosque"](around:${around});
    );
    out center tags;
  `;
}

function elementCoords(element: OverpassElement): { latitude: number; longitude: number } | null {
  if (typeof element.lat === 'number' && typeof element.lon === 'number') {
    return { latitude: element.lat, longitude: element.lon };
  }
  if (element.center) {
    return { latitude: element.center.lat, longitude: element.center.lon };
  }
  return null;
}

function elementName(tags: Record<string, string> | undefined): string {
  const name =
    tags?.name ?? tags?.['name:tr'] ?? tags?.['name:en'] ?? tags?.operator ?? '';
  return name.trim() || 'Cami';
}

async function postOverpass(endpoint: string, query: string): Promise<OverpassResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        Accept: 'application/json',
        // Bazı Overpass sunucuları boş/engelli UA'ya 406 döner
        'User-Agent': 'e-Islam/1.0 (nearby-mosques; contact=support@e-islam.net)',
      },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return (await response.json()) as OverpassResponse;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchNearbyMosques(
  latitude: number,
  longitude: number,
): Promise<NearbyMosque[]> {
  const query = buildQuery(latitude, longitude);

  try {
    return await Promise.any(
      OVERPASS_ENDPOINTS.map(async (endpoint) => {
        const payload = await postOverpass(endpoint, query);
        return parseMosques(payload, latitude, longitude);
      }),
    );
  } catch (lastError) {
    console.warn('[nearbyMosques] all endpoints failed', lastError);
    throw new Error('Yakın camiler alınamadı. Lütfen tekrar deneyin.');
  }
}

function parseMosques(
  payload: OverpassResponse,
  latitude: number,
  longitude: number,
): NearbyMosque[] {
  const seen = new Set<string>();
  const mosques: NearbyMosque[] = [];

  for (const element of payload.elements ?? []) {
    const coords = elementCoords(element);
    if (!coords) continue;

    const key = `${coords.latitude.toFixed(5)}:${coords.longitude.toFixed(5)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    mosques.push({
      id: `${element.type}-${element.id}`,
      name: elementName(element.tags),
      latitude: coords.latitude,
      longitude: coords.longitude,
      distanceKm: calculateDistanceKm(
        latitude,
        longitude,
        coords.latitude,
        coords.longitude,
      ),
    });
  }

  return mosques.sort((a, b) => a.distanceKm - b.distanceKm).slice(0, MAX_RESULTS);
}

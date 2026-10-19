import { calculateDistanceKm } from '../utils/geo';

export type NearbyMosque = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
};

const SEARCH_RADIUS_KM = 6;
const MAX_RESULTS = 40;
const FETCH_TIMEOUT_MS = 12_000;
const USER_AGENT = 'e-Islam/1.0 (nearby-mosques; contact=support@e-islam.net)';

type RawPlace = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function looksLikeMosque(name: string): boolean {
  const n = name.toLocaleLowerCase('tr-TR');
  return (
    n.includes('cami') ||
    n.includes('mescid') ||
    n.includes('mescit') ||
    n.includes('mosque') ||
    n.includes('masjid')
  );
}

async function fetchPhoton(latitude: number, longitude: number, query: string): Promise<RawPlace[]> {
  const url =
    `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}` +
    `&lat=${latitude}&lon=${longitude}&limit=30`;

  const response = await withTimeout(
    fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': USER_AGENT,
      },
    }),
    FETCH_TIMEOUT_MS,
  );

  if (!response.ok) throw new Error(`Photon HTTP ${response.status}`);
  const payload = (await response.json()) as {
    features?: Array<{
      geometry?: { coordinates?: number[] };
      properties?: { osm_id?: number; osm_type?: string; name?: string; type?: string };
    }>;
  };

  const places: RawPlace[] = [];
  for (const feature of payload.features ?? []) {
    const coords = feature.geometry?.coordinates;
    const name = feature.properties?.name?.trim();
    if (!coords || coords.length < 2 || !name) continue;
    if (!looksLikeMosque(name) && feature.properties?.type !== 'place_of_worship') continue;

    places.push({
      id: `photon-${feature.properties?.osm_type ?? 'n'}-${feature.properties?.osm_id ?? name}`,
      name,
      latitude: coords[1],
      longitude: coords[0],
    });
  }
  return places;
}

async function fetchNominatim(latitude: number, longitude: number): Promise<RawPlace[]> {
  // ~6 km viewbox
  const delta = 0.055;
  const viewbox = [
    longitude - delta,
    latitude + delta,
    longitude + delta,
    latitude - delta,
  ].join(',');

  const url =
    `https://nominatim.openstreetmap.org/search?format=json&limit=30` +
    `&q=${encodeURIComponent('cami')}` +
    `&viewbox=${viewbox}&bounded=1`;

  const response = await withTimeout(
    fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': USER_AGENT,
        'Accept-Language': 'tr',
      },
    }),
    FETCH_TIMEOUT_MS,
  );

  if (!response.ok) throw new Error(`Nominatim HTTP ${response.status}`);
  const payload = (await response.json()) as Array<{
    place_id?: number;
    display_name?: string;
    name?: string;
    lat?: string;
    lon?: string;
  }>;

  const places: RawPlace[] = [];
  for (const item of payload) {
    const lat = Number(item.lat);
    const lon = Number(item.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const name =
      item.name?.trim() ||
      item.display_name?.split(',')[0]?.trim() ||
      'Cami';
    places.push({
      id: `nominatim-${item.place_id ?? `${lat},${lon}`}`,
      name,
      latitude: lat,
      longitude: lon,
    });
  }
  return places;
}

function toNearbyMosques(
  places: RawPlace[],
  latitude: number,
  longitude: number,
): NearbyMosque[] {
  const seen = new Set<string>();
  const mosques: NearbyMosque[] = [];

  for (const place of places) {
    const distanceKm = calculateDistanceKm(
      latitude,
      longitude,
      place.latitude,
      place.longitude,
    );
    if (distanceKm > SEARCH_RADIUS_KM) continue;

    const key = `${place.latitude.toFixed(5)}:${place.longitude.toFixed(5)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    mosques.push({
      id: place.id,
      name: place.name,
      latitude: place.latitude,
      longitude: place.longitude,
      distanceKm,
    });
  }

  return mosques.sort((a, b) => a.distanceKm - b.distanceKm).slice(0, MAX_RESULTS);
}

export async function fetchNearbyMosques(
  latitude: number,
  longitude: number,
): Promise<NearbyMosque[]> {
  const errors: unknown[] = [];

  // 1) Photon (konuma göre sıralı, genelde hızlı ve dolu)
  try {
    const [cami, mosque] = await Promise.all([
      fetchPhoton(latitude, longitude, 'cami'),
      fetchPhoton(latitude, longitude, 'mosque'),
    ]);
    const merged = toNearbyMosques([...cami, ...mosque], latitude, longitude);
    if (merged.length > 0) return merged;
  } catch (error) {
    errors.push(error);
  }

  // 2) Nominatim viewbox yedeği
  try {
    const nominatim = await fetchNominatim(latitude, longitude);
    const merged = toNearbyMosques(nominatim, latitude, longitude);
    if (merged.length > 0) return merged;
  } catch (error) {
    errors.push(error);
  }

  console.warn('[nearbyMosques] all providers failed/empty', errors);
  throw new Error('Yakın camiler alınamadı. Lütfen tekrar deneyin.');
}

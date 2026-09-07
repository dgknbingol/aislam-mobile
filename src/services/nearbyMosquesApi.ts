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

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const SEARCH_RADIUS_METERS = 5000;
const MAX_RESULTS = 40;

function buildQuery(latitude: number, longitude: number): string {
  const around = `${SEARCH_RADIUS_METERS},${latitude},${longitude}`;
  return `
    [out:json][timeout:25];
    (
      nwr["amenity"="place_of_worship"]["religion"="muslim"](around:${around});
      nwr["building"="mosque"](around:${around});
      nwr["amenity"="mosque"](around:${around});
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
    tags?.name ??
    tags?.['name:tr'] ??
    tags?.['name:en'] ??
    tags?.operator ??
  '';
  return name.trim() || 'Cami';
}

export async function fetchNearbyMosques(
  latitude: number,
  longitude: number,
): Promise<NearbyMosque[]> {
  const response = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(buildQuery(latitude, longitude))}`,
  });

  if (!response.ok) {
    throw new Error('Yakın camiler alınamadı. Lütfen tekrar deneyin.');
  }

  const payload = (await response.json()) as OverpassResponse;
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

  return mosques
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, MAX_RESULTS);
}

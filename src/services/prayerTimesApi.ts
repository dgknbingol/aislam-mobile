import { PRAYER_BANNERS, type PrayerBannerId } from '../components/prayer-banners/shared';
import { AI_CONFIG } from '../config/ai';

export interface PrayerDay {
  date: string;
  gregorianLabel: string;
  hijriLabel: string;
  imsak: string;
  gunes: string;
  ogle: string;
  ikindi: string;
  aksam: string;
  yatsi: string;
  today: boolean;
  activeVakit: string | null;
  activeSaat: string | null;
}

export interface MonthlyPrayerTimesResponse {
  year: number;
  month: number;
  latitude: number;
  longitude: number;
  fromCache: boolean;
  days: PrayerDay[];
}

interface ApiErrorResponse {
  message?: string;
  code?: string;
}

export async function fetchMonthlyPrayerTimes(
  latitude: number,
  longitude: number,
  year?: number,
  month?: number,
): Promise<MonthlyPrayerTimesResponse> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
  });
  if (year != null) params.set('year', String(year));
  if (month != null) params.set('month', String(month));

  const url = `${AI_CONFIG.ragBaseUrl}/api/prayer-times/monthly?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      'ngrok-skip-browser-warning': 'true',
    },
  });

  let data: MonthlyPrayerTimesResponse | ApiErrorResponse | null = null;
  try {
    data = (await response.json()) as MonthlyPrayerTimesResponse | ApiErrorResponse;
  } catch {
    // non-JSON body
  }

  if (!response.ok) {
    const err = data as ApiErrorResponse | null;
    throw new Error(err?.message ?? `Sunucu hatası (${response.status})`);
  }

  const content = data as MonthlyPrayerTimesResponse | null;
  if (!content?.days?.length) {
    throw new Error('Ezan vakitleri alınamadı.');
  }

  return content;
}

export function getTodayPrayerDay(days: PrayerDay[]): PrayerDay | undefined {
  return days.find((day) => day.today);
}

export function getAdjacentPrayerDay(
  days: PrayerDay[],
  current: PrayerDay,
  offset: 1 | -1,
): PrayerDay | undefined {
  const index = days.findIndex((day) => day.date === current.date);
  if (index < 0) return undefined;
  return days[index + offset];
}

export interface NextPrayerInfo {
  id: PrayerBannerId;
  label: string;
  time: string;
}

export interface PrayerStatus {
  isActive: boolean;
  isPast: boolean;
}

function parsePrayerTimeToDate(timeText: string, now: Date = new Date()): Date {
  const [hours, minutes] = timeText.split(':').map(Number);
  const target = new Date(now);
  target.setHours(hours, minutes, 0, 0);
  return target;
}

export function getNextPrayer(
  day: PrayerDay,
  nextDay?: PrayerDay,
  now: Date = new Date(),
): NextPrayerInfo | null {
  for (const banner of PRAYER_BANNERS) {
    const time = day[banner.timeKey];
    if (parsePrayerTimeToDate(time, now).getTime() > now.getTime()) {
      return { id: banner.id, label: banner.label, time };
    }
  }

  const imsakBanner = PRAYER_BANNERS[0];
  const tomorrowImsak = nextDay?.imsak ?? day.imsak;
  return {
    id: imsakBanner.id,
    label: imsakBanner.label,
    time: tomorrowImsak,
  };
}

export function getPrayerStatuses(
  day: PrayerDay,
  nextDay?: PrayerDay,
  now: Date = new Date(),
): Record<PrayerBannerId, PrayerStatus> {
  const nextPrayer = getNextPrayer(day, nextDay, now);
  const statuses = {} as Record<PrayerBannerId, PrayerStatus>;

  for (const banner of PRAYER_BANNERS) {
    const isActive = nextPrayer?.id === banner.id;
    const isPast =
      parsePrayerTimeToDate(day[banner.timeKey], now).getTime() <= now.getTime() && !isActive;
    statuses[banner.id] = { isActive, isPast };
  }

  return statuses;
}

export function formatRemainingUntil(timeText: string, now: Date = new Date()): string {
  const target = parsePrayerTimeToDate(timeText, now);

  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  const diffMs = target.getTime() - now.getTime();
  const totalMinutes = Math.max(0, Math.floor(diffMs / 60000));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  if (h === 0) {
    return `${m} dakika sonra`;
  }
  return `${h} saat ${m} dakika sonra`;
}

import type { DailyContentKind } from '../types/notificationSettings';

export interface DailyContentNotificationMeta {
  kind: DailyContentKind;
  label: string;
  /** Varsayılan saat */
  hour: number;
  minute: number;
  /** Varsayılan günler (Pazar=0 ... Cumartesi=6) */
  defaultDays: boolean[];
}

const ALL_DAYS = [true, true, true, true, true, true, true] as const;
const FRIDAY_ONLY = [false, false, false, false, false, true, false] as const;

export const DAILY_CONTENT_NOTIFICATIONS: readonly DailyContentNotificationMeta[] = [
  { kind: 'ayet', label: 'Günün Ayeti', hour: 10, minute: 0, defaultDays: [...ALL_DAYS] },
  { kind: 'dua', label: 'Günün Duası', hour: 14, minute: 0, defaultDays: [...ALL_DAYS] },
  { kind: 'hadis', label: 'Günün Hadisi', hour: 16, minute: 0, defaultDays: [...ALL_DAYS] },
  { kind: 'hutbe', label: 'Cuma Hutbesi', hour: 12, minute: 0, defaultDays: [...FRIDAY_ONLY] },
  /** 21:00 — günlük yarışma 20:00 ile çakışmasın */
  { kind: 'asma', label: 'Esmaül Hüsna', hour: 21, minute: 0, defaultDays: [...ALL_DAYS] },
] as const;

export function getDailyContentMeta(kind: DailyContentKind): DailyContentNotificationMeta {
  const found = DAILY_CONTENT_NOTIFICATIONS.find((item) => item.kind === kind);
  if (!found) {
    return DAILY_CONTENT_NOTIFICATIONS[0];
  }
  return found;
}

export function formatClock(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/** Bildirim gövdesi: birkaç kelime + … */
export function buildDailyContentSnippet(text: string, maxWords = 8): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  const words = cleaned.split(' ');
  if (words.length <= maxWords) {
    return cleaned.endsWith('...') ? cleaned : `${cleaned}...`;
  }
  return `${words.slice(0, maxWords).join(' ')}...`;
}

export function buildAsmaNotificationBody(name: string): string {
  const cleaned = name.replace(/\s+/g, ' ').trim();
  if (!cleaned) return 'Bugünün isminin anlamını biliyor musunuz?';
  return `${cleaned}'in anlamını biliyor musunuz?`;
}

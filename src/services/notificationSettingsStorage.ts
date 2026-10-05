import AsyncStorage from '@react-native-async-storage/async-storage';

import { PRAYER_BANNERS, type PrayerBannerId } from '../components/prayer-banners/shared';
import { DAILY_CONTENT_NOTIFICATIONS } from '../constants/dailyContentNotifications';
import {
  clampMelodyIndex,
  NOTIFICATION_MELODIES,
} from '../constants/notificationSounds';
import { COMPETITIONS, type CompetitionKind } from '../utils/competitionSchedule';
import { syncAllNotifications } from './prayerNotificationScheduler';
import type {
  AllCompetitionNotificationSettings,
  AllDailyContentNotificationSettings,
  AllPrayerNotificationSettings,
  CompetitionNotificationSettings,
  DailyContentKind,
  DailyContentNotificationSettings,
  PrayerNotificationSettings,
} from '../types/notificationSettings';

export { NOTIFICATION_MELODIES };

const STORAGE_KEY = '@aislam/notification-settings';
const COMPETITION_STORAGE_KEY = '@aislam/competition-notification-settings';
const DAILY_CONTENT_STORAGE_KEY = '@aislam/daily-content-notification-settings';

export const BEFORE_MINUTES_OPTIONS = [5, 10, 15, 30, 45, 60] as const;

export const WEEKDAY_LABELS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'] as const;

function normalizeTimedSettings(
  settings: PrayerNotificationSettings,
): PrayerNotificationSettings {
  return {
    ...settings,
    atTime: {
      ...settings.atTime,
      melodyIndex: clampMelodyIndex(settings.atTime.melodyIndex),
    },
    before: {
      ...settings.before,
      melodyIndex: clampMelodyIndex(settings.before.melodyIndex),
    },
  };
}

function normalizeDailyContentSettings(
  settings: DailyContentNotificationSettings,
): DailyContentNotificationSettings {
  const hour = Math.min(23, Math.max(0, Math.floor(settings.hour)));
  const minute = Math.min(59, Math.max(0, Math.floor(settings.minute)));
  return {
    enabled: Boolean(settings.enabled),
    melodyIndex: clampMelodyIndex(settings.melodyIndex),
    hour,
    minute,
    days:
      Array.isArray(settings.days) && settings.days.length === 7
        ? settings.days.map(Boolean)
        : [true, true, true, true, true, true, true],
  };
}

export function createDefaultPrayerNotificationSettings(): PrayerNotificationSettings {
  return {
    // 1 = Ezan (bkz. NOTIFICATION_SOUND_OPTIONS)
    atTime: { enabled: true, melodyIndex: 1 },
    before: { enabled: true, melodyIndex: 0, minutesBefore: 15 },
    days: [true, true, true, true, true, true, true],
  };
}

export function createDefaultAllPrayerSettings(): AllPrayerNotificationSettings {
  return PRAYER_BANNERS.reduce<AllPrayerNotificationSettings>((acc, banner) => {
    acc[banner.id] = createDefaultPrayerNotificationSettings();
    return acc;
  }, {} as AllPrayerNotificationSettings);
}

export function createDefaultCompetitionNotificationSettings(
  _kind: CompetitionKind = 'daily',
): CompetitionNotificationSettings {
  return {
    atTime: { enabled: true, melodyIndex: 0 },
    before: { enabled: true, melodyIndex: 0, minutesBefore: 15 },
    days: [true, true, true, true, true, true, true],
  };
}

export function createDefaultAllCompetitionSettings(): AllCompetitionNotificationSettings {
  return {
    daily: createDefaultCompetitionNotificationSettings('daily'),
  };
}

export function createDefaultDailyContentNotificationSettings(
  kind: DailyContentKind,
): DailyContentNotificationSettings {
  const meta = DAILY_CONTENT_NOTIFICATIONS.find((item) => item.kind === kind)!;
  return {
    enabled: true,
    melodyIndex: 0,
    hour: meta.hour,
    minute: meta.minute,
    days: [...meta.defaultDays],
  };
}

export function createDefaultAllDailyContentSettings(): AllDailyContentNotificationSettings {
  return DAILY_CONTENT_NOTIFICATIONS.reduce<AllDailyContentNotificationSettings>((acc, meta) => {
    acc[meta.kind] = createDefaultDailyContentNotificationSettings(meta.kind);
    return acc;
  }, {} as AllDailyContentNotificationSettings);
}

export function getCompetitionLabel(kind: CompetitionKind): string {
  return COMPETITIONS.find((item) => item.kind === kind)?.title ?? 'Yarışma';
}

let memoryCache: AllPrayerNotificationSettings | null = null;
let competitionMemoryCache: AllCompetitionNotificationSettings | null = null;
let dailyContentMemoryCache: AllDailyContentNotificationSettings | null = null;

export async function loadAllPrayerNotificationSettings(): Promise<AllPrayerNotificationSettings> {
  if (memoryCache) return memoryCache;

  const defaults = createDefaultAllPrayerSettings();
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    memoryCache = defaults;
    return defaults;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AllPrayerNotificationSettings>;
    for (const banner of PRAYER_BANNERS) {
      const saved = parsed[banner.id];
      if (saved?.atTime && saved.before && saved.days?.length === 7) {
        defaults[banner.id] = normalizeTimedSettings(saved);
      }
    }
  } catch {
    // use defaults
  }

  memoryCache = defaults;
  return defaults;
}

export async function savePrayerNotificationSettings(
  prayerId: PrayerBannerId,
  settings: PrayerNotificationSettings,
): Promise<void> {
  const all = await loadAllPrayerNotificationSettings();
  all[prayerId] = settings;
  memoryCache = all;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  void syncAllNotifications();
}

export async function saveAllPrayerNotificationSettings(
  all: AllPrayerNotificationSettings,
): Promise<void> {
  const normalized = PRAYER_BANNERS.reduce<AllPrayerNotificationSettings>((acc, banner) => {
    acc[banner.id] = normalizeTimedSettings(all[banner.id] ?? createDefaultPrayerNotificationSettings());
    return acc;
  }, {} as AllPrayerNotificationSettings);
  memoryCache = normalized;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  void syncAllNotifications();
}

export async function loadAllCompetitionNotificationSettings(): Promise<AllCompetitionNotificationSettings> {
  if (competitionMemoryCache) return competitionMemoryCache;

  const defaults = createDefaultAllCompetitionSettings();
  const raw = await AsyncStorage.getItem(COMPETITION_STORAGE_KEY);
  if (!raw) {
    competitionMemoryCache = defaults;
    return defaults;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AllCompetitionNotificationSettings> &
      Record<string, CompetitionNotificationSettings | undefined>;
    const saved = parsed.daily;
    if (saved?.atTime && saved.before && saved.days?.length === 7) {
      defaults.daily = normalizeTimedSettings(saved);
    }
  } catch {
    // use defaults
  }

  competitionMemoryCache = defaults;
  return defaults;
}

export async function saveCompetitionNotificationSettings(
  kind: CompetitionKind,
  settings: CompetitionNotificationSettings,
): Promise<void> {
  if (kind !== 'daily') {
    return;
  }
  const all = await loadAllCompetitionNotificationSettings();
  all.daily = settings;
  competitionMemoryCache = all;
  await AsyncStorage.setItem(COMPETITION_STORAGE_KEY, JSON.stringify(all));
  void syncAllNotifications();
}

export async function loadAllDailyContentNotificationSettings(): Promise<AllDailyContentNotificationSettings> {
  if (dailyContentMemoryCache) return dailyContentMemoryCache;

  const defaults = createDefaultAllDailyContentSettings();
  const raw = await AsyncStorage.getItem(DAILY_CONTENT_STORAGE_KEY);
  if (!raw) {
    dailyContentMemoryCache = defaults;
    return defaults;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AllDailyContentNotificationSettings>;
    for (const meta of DAILY_CONTENT_NOTIFICATIONS) {
      const saved = parsed[meta.kind];
      if (saved && typeof saved.enabled === 'boolean' && saved.days?.length === 7) {
        defaults[meta.kind] = normalizeDailyContentSettings({
          ...createDefaultDailyContentNotificationSettings(meta.kind),
          ...saved,
        });
      }
    }
  } catch {
    // use defaults
  }

  dailyContentMemoryCache = defaults;
  return defaults;
}

export async function saveDailyContentNotificationSettings(
  kind: DailyContentKind,
  settings: DailyContentNotificationSettings,
): Promise<void> {
  const all = await loadAllDailyContentNotificationSettings();
  all[kind] = normalizeDailyContentSettings(settings);
  dailyContentMemoryCache = all;
  await AsyncStorage.setItem(DAILY_CONTENT_STORAGE_KEY, JSON.stringify(all));
  void syncAllNotifications();
}

export function formatDaysSummary(days: boolean[]): string {
  const closed = WEEKDAY_LABELS.filter((_, index) => !days[index]);
  if (closed.length === 0) return 'Hergün açık';
  if (closed.length === 7) return 'Tüm günler kapalı';
  return `${closed.join(', ')} kapalı`;
}

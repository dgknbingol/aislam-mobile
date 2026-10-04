import * as Notifications from 'expo-notifications';
import { AppState, Platform } from 'react-native';

import { PRAYER_BANNERS, type PrayerBannerId } from '../components/prayer-banners/shared';
import { APP_NAME } from '../constants/app';
import {
  buildAsmaNotificationBody,
  buildDailyContentSnippet,
  DAILY_CONTENT_NOTIFICATIONS,
} from '../constants/dailyContentNotifications';
import { getAsmaOfDay } from '../constants/asmaUlHusna';
import {
  getNotificationSoundChannelId,
  getNotificationSoundName,
  getNotificationSoundOption,
  NOTIFICATION_SOUND_OPTIONS,
} from '../constants/notificationSounds';
import {
  navigateToAsmaFromNotification,
  navigateToHomeFromNotification,
} from '../navigation/rootNavigation';
import type {
  DailyContentKind,
  DailyContentNotificationSettings,
  PrayerNotificationSettings,
} from '../types/notificationSettings';
import {
  COMPETITIONS,
  type CompetitionConfig,
  type CompetitionKind,
} from '../utils/competitionSchedule';
import { fetchDailyContent, getCachedDailyContent } from './dailyApi';
import {
  registerDeviceForPrayerPush,
} from './devicePushRegistration';
import { getLatestHutbe } from './hutbeStorage';
import {
  loadAllCompetitionNotificationSettings,
  loadAllDailyContentNotificationSettings,
  loadAllPrayerNotificationSettings,
} from './notificationSettingsStorage';
import type { PrayerDay } from './prayerTimesApi';
import { getVerseOfDay } from './verseOfDay';

/** iOS ~64 pending limit; diğer platformlarda daha yüksek tavan. */
const MAX_PENDING_NOTIFICATIONS = Platform.OS === 'ios' ? 58 : 120;
/** Ezan asıl sunucu push; yerelde yalnızca kısa offline yedek. */
const LOCAL_PRAYER_FALLBACK_COUNT = 2;
const LOOKAHEAD_DAYS = 3;

let prayerDays: PrayerDay[] = [];
let syncInFlight: Promise<void> | null = null;
let responseSubscription: { remove: () => void } | null = null;
/** Aktif sync sırasında planlanan bildirim sayısı (bütçe). */
let scheduledInPass = 0;

export function setPrayerDaysForScheduling(days: PrayerDay[]): void {
  prayerDays = days;
}

function handleNotificationResponse(
  response: Notifications.NotificationResponse | null,
): void {
  if (!response) return;
  const data = response.notification.request.content.data as
    | {
        type?: string;
        openHome?: boolean;
        dailyKind?: string;
        catalogIndex?: number;
        competitionKind?: string;
      }
    | undefined;

  if (!data) return;

  if (
    data.dailyKind === 'asma' &&
    (data.type === 'daily-content' || data.type === 'test-daily')
  ) {
    navigateToAsmaFromNotification(
      typeof data.catalogIndex === 'number' ? data.catalogIndex : undefined,
    );
    return;
  }

  if (
    data.type === 'prayer' ||
    data.type === 'daily-content' ||
    data.type === 'test-daily' ||
    data.openHome === true ||
    typeof data.competitionKind === 'string'
  ) {
    navigateToHomeFromNotification();
  }
}

export function initPrayerNotifications(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (!responseSubscription) {
    responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      handleNotificationResponse(response);
    });
  }

  void Notifications.getLastNotificationResponseAsync().then((response) => {
    handleNotificationResponse(response);
  });

  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      void syncAllNotifications();
    }
  });
}

export async function getNotificationPermissionStatus(): Promise<Notifications.PermissionStatus> {
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

export async function ensureNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await setupAndroidChannels();
  }

  const current = await Notifications.getPermissionsAsync();
  if (current.status === Notifications.PermissionStatus.GRANTED) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: false,
      allowSound: true,
    },
  });

  return requested.status === Notifications.PermissionStatus.GRANTED;
}

async function setupAndroidChannels(): Promise<void> {
  for (let index = 0; index < NOTIFICATION_SOUND_OPTIONS.length; index += 1) {
    const option = NOTIFICATION_SOUND_OPTIONS[index];
    await Notifications.setNotificationChannelAsync(getNotificationSoundChannelId(index), {
      name: `Bildirim: ${option.label}`,
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 220, 120, 220],
      sound: option.kind === 'default' ? 'default' : option.fileName,
    });
  }
}

function buildDateTime(dateStr: string, timeText: string): Date | null {
  const dateParts = dateStr.split('-').map(Number);
  const timeParts = timeText.split(':').map(Number);
  if (dateParts.length !== 3 || timeParts.length < 2) return null;

  const [year, month, day] = dateParts;
  const [hour, minute] = timeParts;
  if ([year, month, day, hour, minute].some((value) => Number.isNaN(value))) {
    return null;
  }

  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

function getUpcomingDays(days: PrayerDay[]): PrayerDay[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return days
    .filter((day) => {
      const date = buildDateTime(day.date, '00:00');
      return date != null && date.getTime() >= today.getTime();
    })
    .slice(0, LOOKAHEAD_DAYS);
}

function getChannelId(melodyIndex: number): string {
  return getNotificationSoundChannelId(melodyIndex);
}

type NotificationKind = 'atTime' | 'before';

/** Saat/dakikadan dakika çıkar; gece yarısını geçerse önceki hafta gününe kaydır. */
function subtractMinutesWithWeekday(
  weekday: number,
  hour: number,
  minute: number,
  minutesBefore: number,
): { weekday: number; hour: number; minute: number } {
  const totalMinutes = hour * 60 + minute - minutesBefore;
  if (totalMinutes >= 0) {
    return {
      weekday,
      hour: Math.floor(totalMinutes / 60),
      minute: totalMinutes % 60,
    };
  }
  const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  return {
    weekday: (weekday + 6) % 7,
    hour: Math.floor(normalized / 60),
    minute: normalized % 60,
  };
}

function toExpoWeekday(dayIndex: number): number {
  return dayIndex + 1;
}

async function tryScheduleNotification(
  request: Notifications.NotificationRequestInput,
): Promise<boolean> {
  if (scheduledInPass >= MAX_PENDING_NOTIFICATIONS) {
    return false;
  }
  await Notifications.scheduleNotificationAsync(request);
  scheduledInPass += 1;
  return true;
}

async function cancelAislamNotifications(): Promise<void> {
  const pending = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    pending
      .filter(
        (item) =>
          item.identifier.startsWith('aislam-') &&
          !item.identifier.startsWith('aislam-test-'),
      )
      .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)),
  );
}

async function resolveDailyContentBodies(): Promise<{
  bodies: Record<DailyContentKind, string>;
  asmaCatalogIndex: number;
}> {
  const asmaOfDay = getAsmaOfDay();
  const bodies: Record<DailyContentKind, string> = {
    ayet: 'Bugünün ayetini okumak için dokunun...',
    dua: 'Bugünün duasını okumak için dokunun...',
    hadis: 'Bugünün hadisini okumak için dokunun...',
    hutbe: 'Bu haftanın Cuma hutbesini okumak için dokunun...',
    asma: buildAsmaNotificationBody(asmaOfDay.item.name),
  };

  try {
    const verse = await getVerseOfDay();
    if (verse?.translation) {
      bodies.ayet = buildDailyContentSnippet(verse.translation) || bodies.ayet;
    }
  } catch {
    // ayet yoksa varsayılan
  }

  try {
    const daily = (await getCachedDailyContent()) ?? (await fetchDailyContent().catch(() => null));
    if (daily) {
      bodies.dua = buildDailyContentSnippet(daily.dua.text) || bodies.dua;
      bodies.hadis = buildDailyContentSnippet(daily.hadis.text) || bodies.hadis;
    }
  } catch {
    // cache/API yoksa varsayılan metin
  }

  try {
    const hutbe = await getLatestHutbe();
    if (hutbe?.title) {
      bodies.hutbe = buildDailyContentSnippet(hutbe.title) || bodies.hutbe;
    }
  } catch {
    // hutbe yoksa varsayılan
  }

  return { bodies, asmaCatalogIndex: asmaOfDay.catalogIndex };
}

async function scheduleDailyContentOne(params: {
  kind: DailyContentKind;
  title: string;
  body: string;
  weekday: number;
  hour: number;
  minute: number;
  melodyIndex: number;
  asmaCatalogIndex?: number;
}): Promise<void> {
  const { kind, title, body, weekday, hour, minute, melodyIndex, asmaCatalogIndex } = params;

  await tryScheduleNotification({
    identifier: `aislam-daily-${kind}-wd${weekday}`,
    content: {
      title,
      body,
      sound: getNotificationSoundName(melodyIndex),
      data: {
        type: 'daily-content',
        dailyKind: kind,
        openHome: kind !== 'asma',
        ...(kind === 'asma' && asmaCatalogIndex != null
          ? { catalogIndex: asmaCatalogIndex }
          : {}),
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: toExpoWeekday(weekday),
      hour,
      minute,
      channelId: getChannelId(melodyIndex),
    },
  });
}

async function scheduleDailyContentNotifications(): Promise<void> {
  const settingsByKind = await loadAllDailyContentNotificationSettings();
  const { bodies, asmaCatalogIndex } = await resolveDailyContentBodies();

  for (const meta of DAILY_CONTENT_NOTIFICATIONS) {
    const settings: DailyContentNotificationSettings = settingsByKind[meta.kind];
    if (!settings.enabled) continue;

    for (let weekday = 0; weekday < 7; weekday += 1) {
      if (!settings.days[weekday]) continue;

      await scheduleDailyContentOne({
        kind: meta.kind,
        title: meta.label,
        body: bodies[meta.kind],
        weekday,
        hour: settings.hour,
        minute: settings.minute,
        melodyIndex: settings.melodyIndex,
        asmaCatalogIndex: meta.kind === 'asma' ? asmaCatalogIndex : undefined,
      });
    }
  }
}

function shouldScheduleDay(settings: PrayerNotificationSettings, date: Date): boolean {
  return settings.days[date.getDay()] === true;
}

async function schedulePrayerOne(params: {
  prayerId: PrayerBannerId;
  prayerLabel: string;
  kind: NotificationKind;
  fireAt: Date;
  melodyIndex: number;
  dateKey: string;
}): Promise<void> {
  const { prayerId, prayerLabel, kind, fireAt, melodyIndex, dateKey } = params;
  if (fireAt.getTime() <= Date.now()) return;

  const isBefore = kind === 'before';
  const title = isBefore ? `${prayerLabel} vaktine az kaldı` : `${prayerLabel} vakti`;
  const body = isBefore
    ? `${prayerLabel} vaktine hazırlanın.`
    : `${prayerLabel} vakti girdi.`;

  await tryScheduleNotification({
    identifier: `aislam-prayer-${prayerId}-${kind}-${dateKey}`,
    content: {
      title,
      body,
      sound: getNotificationSoundName(melodyIndex),
      data: {
        type: 'prayer',
        prayerId,
        kind,
        dateKey,
        openHome: true,
        sound: getNotificationSoundOption(melodyIndex).label,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fireAt,
      channelId: getChannelId(melodyIndex),
    },
  });
}

async function scheduleCompetitionWeekly(params: {
  kind: CompetitionKind;
  title: string;
  alertKind: NotificationKind;
  weekday: number;
  hour: number;
  minute: number;
  melodyIndex: number;
  minutesBefore?: number;
}): Promise<void> {
  const { kind, title, alertKind, weekday, hour, minute, melodyIndex, minutesBefore = 0 } = params;
  const fireTime =
    alertKind === 'before'
      ? subtractMinutesWithWeekday(weekday, hour, minute, minutesBefore)
      : { weekday, hour, minute };
  const isBefore = alertKind === 'before';

  await tryScheduleNotification({
    identifier: `aislam-competition-${kind}-${alertKind}-wd${weekday}`,
    content: {
      title: isBefore ? `${title} başlamak üzere` : `${title} başladı!`,
      body: isBefore
        ? `${title} ${minutesBefore} dakika içinde başlıyor. Hazır ol!`
        : `${title} başladı. Hemen katıl!`,
      sound: getNotificationSoundName(melodyIndex),
      data: { competitionKind: kind, kind: alertKind, openHome: true },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: toExpoWeekday(fireTime.weekday),
      hour: fireTime.hour,
      minute: fireTime.minute,
      channelId: getChannelId(melodyIndex),
    },
  });
}

async function scheduleCompetitionNotifications(): Promise<void> {
  const settingsByKind = await loadAllCompetitionNotificationSettings();

  for (const config of COMPETITIONS) {
    if (config.kind !== 'daily') continue;

    const settings = settingsByKind.daily;
    const weekdays = getCompetitionWeekdays(config);

    for (const weekday of weekdays) {
      if (!settings.days[weekday]) continue;

      if (settings.atTime.enabled) {
        await scheduleCompetitionWeekly({
          kind: config.kind,
          title: config.title,
          alertKind: 'atTime',
          weekday,
          hour: config.hour,
          minute: config.minute,
          melodyIndex: settings.atTime.melodyIndex,
        });
      }

      if (settings.before.enabled) {
        await scheduleCompetitionWeekly({
          kind: config.kind,
          title: config.title,
          alertKind: 'before',
          weekday,
          hour: config.hour,
          minute: config.minute,
          melodyIndex: settings.before.melodyIndex,
          minutesBefore: settings.before.minutesBefore,
        });
      }
    }
  }
}

function getCompetitionWeekdays(_config: CompetitionConfig): number[] {
  return [0, 1, 2, 3, 4, 5, 6];
}

type UpcomingPrayerEvent = {
  prayerId: PrayerBannerId;
  prayerLabel: string;
  kind: NotificationKind;
  fireAt: Date;
  melodyIndex: number;
  dateKey: string;
};

async function schedulePrayerNotifications(): Promise<void> {
  if (prayerDays.length === 0) return;

  const settingsByPrayer = await loadAllPrayerNotificationSettings();
  const upcomingDays = getUpcomingDays(prayerDays);
  const now = Date.now();
  const candidates: UpcomingPrayerEvent[] = [];

  for (const day of upcomingDays) {
    const dayDate = buildDateTime(day.date, '00:00');
    if (!dayDate) continue;

    for (const banner of PRAYER_BANNERS) {
      const settings = settingsByPrayer[banner.id];
      if (!shouldScheduleDay(settings, dayDate)) continue;

      const prayerTime = day[banner.timeKey];
      const atTimeDate = buildDateTime(day.date, prayerTime);
      if (!atTimeDate) continue;

      if (settings.atTime.enabled && atTimeDate.getTime() > now) {
        candidates.push({
          prayerId: banner.id,
          prayerLabel: banner.label,
          kind: 'atTime',
          fireAt: atTimeDate,
          melodyIndex: settings.atTime.melodyIndex,
          dateKey: day.date,
        });
      }

      if (settings.before.enabled) {
        const beforeDate = new Date(
          atTimeDate.getTime() - settings.before.minutesBefore * 60_000,
        );
        if (beforeDate.getTime() > now) {
          candidates.push({
            prayerId: banner.id,
            prayerLabel: banner.label,
            kind: 'before',
            fireAt: beforeDate,
            melodyIndex: settings.before.melodyIndex,
            dateKey: day.date,
          });
        }
      }
    }
  }

  candidates.sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime());

  for (const event of candidates.slice(0, LOCAL_PRAYER_FALLBACK_COUNT)) {
    if (scheduledInPass >= MAX_PENDING_NOTIFICATIONS) return;
    await schedulePrayerOne(event);
  }
}

export async function syncAllNotifications(): Promise<void> {
  if (syncInFlight) {
    await syncInFlight;
    return;
  }

  syncInFlight = (async () => {
    const granted = await ensureNotificationPermissions();
    if (!granted) {
      void registerDeviceForPrayerPush();
      return;
    }

    await cancelAislamNotifications();
    scheduledInPass = 0;

    // Öncelik: yarışma (az) → ezan yedek (1–2) → günlük içerik
    await scheduleCompetitionNotifications();
    await schedulePrayerNotifications();
    await scheduleDailyContentNotifications();

    // Ezan asıl: sunucu Expo Push
    void registerDeviceForPrayerPush();
  })();

  try {
    await syncInFlight;
  } finally {
    syncInFlight = null;
  }
}

export async function syncPrayerNotifications(): Promise<void> {
  return syncAllNotifications();
}

/** Expo / cihaz testi için birkaç saniye sonra tek bildirim planlar. */
export async function scheduleTestNotification(
  seconds = 10,
  melodyIndex = 1,
): Promise<boolean> {
  const granted = await ensureNotificationPermissions();
  if (!granted) return false;

  await Notifications.scheduleNotificationAsync({
    identifier: 'aislam-test-notification',
    content: {
      title: `${APP_NAME} test bildirimi`,
      body: `Bildirimler çalışıyor. (${seconds} sn sonra)`,
      sound: getNotificationSoundName(melodyIndex),
      data: { test: true },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(1, seconds),
      channelId: getChannelId(melodyIndex),
    },
  });

  return true;
}

/** Günlük içerik bildirimlerini birkaç saniye arayla test eder (snippet gövde). */
export async function scheduleDailyContentTestNotifications(
  firstAfterSeconds = 10,
): Promise<boolean> {
  const granted = await ensureNotificationPermissions();
  if (!granted) return false;

  const settingsByKind = await loadAllDailyContentNotificationSettings();
  const { bodies, asmaCatalogIndex } = await resolveDailyContentBodies();
  const start = Math.max(1, firstAfterSeconds);

  for (let index = 0; index < DAILY_CONTENT_NOTIFICATIONS.length; index += 1) {
    const meta = DAILY_CONTENT_NOTIFICATIONS[index];
    const melodyIndex = settingsByKind[meta.kind].melodyIndex;

    await Notifications.scheduleNotificationAsync({
      identifier: `aislam-test-daily-${meta.kind}`,
      content: {
        title: meta.label,
        body: bodies[meta.kind],
        sound: getNotificationSoundName(melodyIndex),
        data: {
          type: 'test-daily',
          dailyKind: meta.kind,
          openHome: meta.kind !== 'asma',
          ...(meta.kind === 'asma' ? { catalogIndex: asmaCatalogIndex } : {}),
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: start + index * 3,
        channelId: getChannelId(melodyIndex),
      },
    });
  }

  return true;
}

export async function getScheduledNotificationCount(): Promise<number> {
  const pending = await Notifications.getAllScheduledNotificationsAsync();
  return pending.length;
}

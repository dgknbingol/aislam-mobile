import type { PrayerBannerId } from '../components/prayer-banners/shared';
import type { CompetitionKind } from '../utils/competitionSchedule';

export interface PrayerAlertSettings {
  enabled: boolean;
  melodyIndex: number;
}

export interface PrayerBeforeAlertSettings extends PrayerAlertSettings {
  minutesBefore: number;
}

export interface TimedNotificationSettings {
  atTime: PrayerAlertSettings;
  before: PrayerBeforeAlertSettings;
  /** Pazar=0 ... Cumartesi=6 */
  days: boolean[];
}

export type PrayerNotificationSettings = TimedNotificationSettings;
export type CompetitionNotificationSettings = TimedNotificationSettings;

export type AllPrayerNotificationSettings = Record<PrayerBannerId, PrayerNotificationSettings>;
/** Yalnızca günlük yarışma bildirimi planlanır. */
export type AllCompetitionNotificationSettings = {
  daily: CompetitionNotificationSettings;
};

/** Ana sayfa günlük içerik bildirimleri (ayet / dua / hadis / hutbe / esma). */
export type DailyContentKind = 'ayet' | 'dua' | 'hadis' | 'hutbe' | 'asma';

export interface DailyContentNotificationSettings {
  enabled: boolean;
  melodyIndex: number;
  /** 0–23 */
  hour: number;
  /** 0–59 */
  minute: number;
  /** Pazar=0 ... Cumartesi=6 */
  days: boolean[];
}

export type AllDailyContentNotificationSettings = Record<
  DailyContentKind,
  DailyContentNotificationSettings
>;

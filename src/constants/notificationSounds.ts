/**
 * Bildirim ses kataloğu.
 *
 * Dosyalar: assets/sounds/
 * Plugin: app.config.ts → expo-notifications.sounds
 *
 * Yeni native build gerekir. Android'de ses değişince SOUND_CHANNEL_VERSION artır.
 * iOS bildirim sesi ~30 sn ile sınırlıdır; uzun ezan yerine kısa kesit kullan.
 */

export const SOUND_CHANNEL_VERSION = 3;

export type NotificationSoundKind = 'default' | 'custom';

export interface NotificationSoundOption {
  /** Ayarlar ekranında görünen ad */
  label: string;
  /**
   * 'default' = sistem sesi.
   * Aksi halde assets/sounds altındaki dosya adı (uzantılı).
   */
  fileName: 'default' | string;
  kind: NotificationSoundKind;
}

export const NOTIFICATION_SOUND_OPTIONS: readonly NotificationSoundOption[] = [
  { label: 'Varsayılan', fileName: 'default', kind: 'default' },
  { label: 'Ezan', fileName: 'ezan.wav', kind: 'custom' },
  { label: 'Melodi 1', fileName: 'melody_1.wav', kind: 'custom' },
  { label: 'Melodi 2', fileName: 'melody_2.wav', kind: 'custom' },
  { label: 'Melodi 3', fileName: 'melody_3.wav', kind: 'custom' },
  { label: 'Bildirim 1', fileName: 'notification1.mp3', kind: 'custom' },
  { label: 'Bildirim 2', fileName: 'notification2.mp3', kind: 'custom' },
  { label: 'Bildirim 3', fileName: 'notification3.mp3', kind: 'custom' },
  { label: 'Bildirim 4', fileName: 'notification4.mp3', kind: 'custom' },
  { label: 'Bildirim 5', fileName: 'notification5.mp3', kind: 'custom' },
  { label: 'Bildirim 6', fileName: 'notification6.mp3', kind: 'custom' },
  { label: 'Bildirim 7', fileName: 'notification7.mp3', kind: 'custom' },
] as const;

/** Ayarlar picker için etiket listesi (eski NOTIFICATION_MELODIES uyumu). */
export const NOTIFICATION_MELODIES = NOTIFICATION_SOUND_OPTIONS.map(
  (option) => option.label,
) as readonly string[];

/** Plugin'e eklenecek özel ses dosya yolları (proje köküne göre). app.config.ts ile senkron tut. */
export const NOTIFICATION_SOUND_ASSET_PATHS = NOTIFICATION_SOUND_OPTIONS.filter(
  (option) => option.kind === 'custom',
).map((option) => `./assets/sounds/${option.fileName}`);

export function clampMelodyIndex(index: number): number {
  if (!Number.isFinite(index) || index < 0) return 0;
  return Math.min(Math.floor(index), NOTIFICATION_SOUND_OPTIONS.length - 1);
}

export function getNotificationSoundOption(index: number): NotificationSoundOption {
  return NOTIFICATION_SOUND_OPTIONS[clampMelodyIndex(index)];
}

/** scheduleNotificationAsync content.sound değeri */
export function getNotificationSoundName(index: number): string | boolean {
  const option = getNotificationSoundOption(index);
  return option.kind === 'default' ? 'default' : option.fileName;
}

/** Android NotificationChannel id — versiyonlu; ses değişince version bump */
export function getNotificationSoundChannelId(index: number): string {
  const safeIndex = clampMelodyIndex(index);
  return `notif-sound-v${SOUND_CHANNEL_VERSION}-${safeIndex}`;
}

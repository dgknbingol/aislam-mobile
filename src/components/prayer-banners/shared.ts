export type PrayerBannerId = 'imsak' | 'gunes' | 'ogle' | 'ikindi' | 'aksam' | 'yatsi';

export interface PrayerBannerItem {
  id: PrayerBannerId;
  label: string;
  timeKey: 'imsak' | 'gunes' | 'ogle' | 'ikindi' | 'aksam' | 'yatsi';
}

export const PRAYER_BANNERS: PrayerBannerItem[] = [
  { id: 'imsak', label: 'İmsak', timeKey: 'imsak' },
  { id: 'gunes', label: 'Güneş', timeKey: 'gunes' },
  { id: 'ogle', label: 'Öğle', timeKey: 'ogle' },
  { id: 'ikindi', label: 'İkindi', timeKey: 'ikindi' },
  { id: 'aksam', label: 'Akşam', timeKey: 'aksam' },
  { id: 'yatsi', label: 'Yatsı', timeKey: 'yatsi' },
];

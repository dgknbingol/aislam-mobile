import { Asset } from 'expo-asset';
import type { ImageSourcePropType } from 'react-native';

import type { PrayerBannerId } from './shared';

export const PRAYER_BANNER_IMAGES: Record<PrayerBannerId, ImageSourcePropType> = {
  imsak: require('../../../assets/prayer-times/imsak.png'),
  gunes: require('../../../assets/prayer-times/gunes.png'),
  ogle: require('../../../assets/prayer-times/ogle.png'),
  ikindi: require('../../../assets/prayer-times/ikindi.png'),
  aksam: require('../../../assets/prayer-times/aksam.png'),
  yatsi: require('../../../assets/prayer-times/yatsi.png'),
};

export const PRAYER_BANNER_ASPECTS: Record<PrayerBannerId, number> = {
  imsak: 1024 / 146,
  gunes: 1024 / 136,
  ogle: 1024 / 133,
  ikindi: 1024 / 119,
  aksam: 1024 / 103,
  yatsi: 1024 / 114,
};

export function getPrayerBannerAspect(id: PrayerBannerId): number {
  return PRAYER_BANNER_ASPECTS[id];
}

export async function preloadPrayerBannerImages(): Promise<void> {
  await Promise.all(
    (Object.values(PRAYER_BANNER_IMAGES) as number[]).map((source) =>
      Asset.fromModule(source).downloadAsync(),
    ),
  );
}

import AsyncStorage from '@react-native-async-storage/async-storage';

import type { EducationCatalog } from '../types/education';

const CATALOG_CACHE_KEY = '@aislam/education/catalog';

export async function readCachedEducationCatalog(): Promise<EducationCatalog | null> {
  const raw = await AsyncStorage.getItem(CATALOG_CACHE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as EducationCatalog;
  } catch {
    return null;
  }
}

export async function writeCachedEducationCatalog(catalog: EducationCatalog): Promise<void> {
  await AsyncStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify(catalog));
}

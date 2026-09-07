import { useCallback, useEffect, useState } from 'react';

import { EDUCATION_CATEGORIES, EDUCATION_CATALOG_VERSION } from '../constants/educationCatalog';
import { EducationApiError, fetchEducationCatalog } from '../services/educationApi';
import { readCachedEducationCatalog, writeCachedEducationCatalog } from '../services/educationCache';
import type { EducationCatalog, EducationCategory, EducationModule } from '../types/education';

function catalogFromFallback(): EducationCatalog {
  return {
    version: EDUCATION_CATALOG_VERSION,
    categories: EDUCATION_CATEGORIES.map((category) => ({
      id: category.id,
      title: category.title,
      subtitle: category.subtitle,
      icon: category.icon,
      quiz: category.quiz,
      modules: category.modules.map((module) => ({
        id: module.id,
        title: module.title,
        summary: module.summary,
        quiz: module.quiz,
        lessons: module.lessons.map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          summary: lesson.summary,
          hasContent: false,
        })),
      })),
    })),
  };
}

export function useEducationCatalog() {
  const [catalog, setCatalog] = useState<EducationCatalog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOfflineFallback, setIsOfflineFallback] = useState(false);

  const applyCatalog = useCallback((next: EducationCatalog, offline: boolean) => {
    setCatalog(next);
    setIsOfflineFallback(offline);
    setError(offline ? 'Çevrimdışı mod: kayıtlı veya yerel katalog gösteriliyor.' : null);
  }, []);

  const load = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const remote = await fetchEducationCatalog();
      await writeCachedEducationCatalog(remote);
      applyCatalog(remote, false);
    } catch (e) {
      const cached = await readCachedEducationCatalog();
      if (cached) {
        applyCatalog(cached, true);
      } else {
        applyCatalog(catalogFromFallback(), true);
        setError(e instanceof EducationApiError ? e.message : 'Eğitim kataloğu yüklenemedi.');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [applyCatalog]);

  useEffect(() => {
    void load(false);
  }, [load]);

  const getCategory = useCallback(
    (categoryId: string): EducationCategory | undefined =>
      catalog?.categories.find((category) => category.id === categoryId),
    [catalog],
  );

  const getModule = useCallback(
    (categoryId: string, moduleId: string): EducationModule | undefined =>
      getCategory(categoryId)?.modules.find((module) => module.id === moduleId),
    [getCategory],
  );

  return {
    catalog,
    isLoading,
    isRefreshing,
    error,
    isOfflineFallback,
    refresh: () => load(true),
    getCategory,
    getModule,
  };
}

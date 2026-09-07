import { useCallback, useEffect, useState } from 'react';

import { getEducationLesson } from '../constants/educationCatalog';
import { EducationApiError, fetchEducationTopic } from '../services/educationApi';
import type { EducationTopicDetail } from '../types/education';

export function useEducationTopic(lessonId: string) {
  const [topic, setTopic] = useState<EducationTopicDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const remote = await fetchEducationTopic(lessonId);
      setTopic(remote);
    } catch (e) {
      const fallback = getEducationLesson(lessonId);
      if (fallback) {
        setTopic({
          id: fallback.lesson.id,
          categoryId: fallback.category.id,
          categoryTitle: fallback.category.title,
          moduleId: fallback.module.id,
          moduleTitle: fallback.module.title,
          title: fallback.lesson.title,
          summary: fallback.lesson.summary,
          content: null,
        });
      } else {
        setTopic(null);
      }
      setError(e instanceof EducationApiError ? e.message : 'Ders yüklenemedi.');
    } finally {
      setIsLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { topic, isLoading, error, reload: load };
}

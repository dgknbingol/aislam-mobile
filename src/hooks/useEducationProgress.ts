import { useCallback, useEffect, useState } from 'react';

import {
  areAllLessonsCompleted,
  completeLessonWithXp,
  countCompletedLessons,
  getModuleQuizBestScore,
  hasTakenCategoryQuiz,
  hasTakenModuleQuiz,
  isLessonCompleted,
  isModuleCompleted,
  readEducationProgress,
  submitModuleQuizWithXp,
  type EducationProgressState,
  type ProgressRewardResult,
} from '../services/educationProgressStorage';

export function useEducationProgress() {
  const [progress, setProgress] = useState<EducationProgressState | null>(null);

  const refresh = useCallback(async () => {
    const next = await readEducationProgress();
    setProgress(next);
    return next;
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const completeLesson = useCallback(
    async (lessonId: string, moduleId: string, moduleLessonIds: string[]) => {
      const result = await completeLessonWithXp(lessonId, moduleId, moduleLessonIds);
      setProgress(result.state);
      return result;
    },
    [],
  );

  const submitModuleQuiz = useCallback(
    async (moduleId: string, quizId: string, correctCount: number, totalCount: number) => {
      const result = await submitModuleQuizWithXp(moduleId, quizId, correctCount, totalCount);
      setProgress(result.state);
      return result;
    },
    [],
  );

  return {
    progress,
    refresh,
    completeLesson,
    submitModuleQuiz,
    totalXp: progress?.totalXp ?? 0,
    isLessonCompleted: (lessonId: string) =>
      progress ? isLessonCompleted(progress, lessonId) : false,
    isModuleCompleted: (moduleId: string) =>
      progress ? isModuleCompleted(progress, moduleId) : false,
    hasTakenModuleQuiz: (moduleId: string) =>
      progress ? hasTakenModuleQuiz(progress, moduleId) : false,
    hasTakenCategoryQuiz: (categoryId: string) =>
      progress ? hasTakenCategoryQuiz(progress, categoryId) : false,
    getModuleQuizBestScore: (moduleId: string) =>
      progress ? getModuleQuizBestScore(progress, moduleId) : null,
    countCompletedLessons: (lessonIds: string[]) =>
      progress ? countCompletedLessons(progress, lessonIds) : 0,
    areAllLessonsCompleted: (lessonIds: string[]) =>
      progress ? areAllLessonsCompleted(progress, lessonIds) : false,
  };
}

export type { ProgressRewardResult };

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  EDUCATION_ACHIEVEMENTS,
  getModuleCompleteAchievementId,
  getQuizPerfectAchievementId,
} from '../constants/educationAchievements';
import { EDUCATION_XP } from '../constants/educationXp';

const STORAGE_KEY = '@aislam/education/progress';

export type ModuleQuizResult = {
  lastAttemptAt: string;
  correctCount: number;
  totalCount: number;
  bestCorrectCount: number;
};

export type EducationProgressState = {
  totalXp: number;
  completedLessons: Record<string, string>;
  completedModules: Record<string, string>;
  moduleQuizResults: Record<string, ModuleQuizResult>;
  categoryQuizResults: Record<string, ModuleQuizResult>;
  earnedAchievements: Record<string, string>;
};

const EMPTY_STATE: EducationProgressState = {
  totalXp: 0,
  completedLessons: {},
  completedModules: {},
  moduleQuizResults: {},
  categoryQuizResults: {},
  earnedAchievements: {},
};

export type ProgressRewardResult = {
  state: EducationProgressState;
  xpGained: number;
  leveledUp: boolean;
  previousLevel: number;
  newLevel: number;
  newAchievements: string[];
};

let memoryCache: EducationProgressState | null = null;

function sanitizeState(raw: unknown): EducationProgressState {
  if (!raw || typeof raw !== 'object') {
    return { ...EMPTY_STATE };
  }

  const data = raw as Partial<EducationProgressState>;
  return {
    totalXp: typeof data.totalXp === 'number' ? data.totalXp : 0,
    completedLessons:
      data.completedLessons && typeof data.completedLessons === 'object'
        ? data.completedLessons
        : {},
    completedModules:
      data.completedModules && typeof data.completedModules === 'object'
        ? data.completedModules
        : {},
    moduleQuizResults:
      data.moduleQuizResults && typeof data.moduleQuizResults === 'object'
        ? data.moduleQuizResults
        : {},
    categoryQuizResults:
      data.categoryQuizResults && typeof data.categoryQuizResults === 'object'
        ? data.categoryQuizResults
        : {},
    earnedAchievements:
      data.earnedAchievements && typeof data.earnedAchievements === 'object'
        ? data.earnedAchievements
        : {},
  };
}

function levelFromXp(totalXp: number): number {
  return Math.floor(totalXp / EDUCATION_XP.XP_PER_LEVEL) + 1;
}

function awardAchievement(
  state: EducationProgressState,
  achievementId: string,
  newAchievements: string[],
): EducationProgressState {
  if (state.earnedAchievements[achievementId]) {
    return state;
  }
  newAchievements.push(achievementId);
  return {
    ...state,
    earnedAchievements: {
      ...state.earnedAchievements,
      [achievementId]: new Date().toISOString(),
    },
  };
}

function addXp(state: EducationProgressState, amount: number): EducationProgressState {
  if (amount <= 0) {
    return state;
  }
  return { ...state, totalXp: state.totalXp + amount };
}

async function writeEducationProgress(state: EducationProgressState): Promise<void> {
  memoryCache = state;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export async function readEducationProgress(): Promise<EducationProgressState> {
  if (memoryCache) {
    return memoryCache;
  }

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    memoryCache = raw ? sanitizeState(JSON.parse(raw)) : { ...EMPTY_STATE };
    return memoryCache;
  } catch {
    memoryCache = { ...EMPTY_STATE };
    return memoryCache;
  }
}

export async function completeLessonWithXp(
  lessonId: string,
  moduleId: string,
  moduleLessonIds: string[],
): Promise<ProgressRewardResult> {
  const state = await readEducationProgress();
  const previousLevel = levelFromXp(state.totalXp);
  const newAchievements: string[] = [];

  if (state.completedLessons[lessonId]) {
    return {
      state,
      xpGained: 0,
      leveledUp: false,
      previousLevel,
      newLevel: previousLevel,
      newAchievements,
    };
  }

  let next = addXp(
    {
      ...state,
      completedLessons: {
        ...state.completedLessons,
        [lessonId]: new Date().toISOString(),
      },
    },
    EDUCATION_XP.LESSON_COMPLETE,
  );

  let xpGained = EDUCATION_XP.LESSON_COMPLETE;

  const allLessonsDone =
    moduleLessonIds.length > 0 &&
    moduleLessonIds.every((id) => id === lessonId || Boolean(next.completedLessons[id]));

  if (allLessonsDone && !next.completedModules[moduleId]) {
    next = addXp(
      {
        ...next,
        completedModules: {
          ...next.completedModules,
          [moduleId]: new Date().toISOString(),
        },
      },
      EDUCATION_XP.MODULE_COMPLETE_BONUS,
    );
    xpGained += EDUCATION_XP.MODULE_COMPLETE_BONUS;
    next = awardAchievement(next, getModuleCompleteAchievementId(moduleId), newAchievements);
  }

  await writeEducationProgress(next);
  const newLevel = levelFromXp(next.totalXp);

  return {
    state: next,
    xpGained,
    leveledUp: newLevel > previousLevel,
    previousLevel,
    newLevel,
    newAchievements,
  };
}

export async function submitModuleQuizWithXp(
  moduleId: string,
  quizId: string,
  correctCount: number,
  totalCount: number,
): Promise<ProgressRewardResult> {
  const state = await readEducationProgress();
  const previousLevel = levelFromXp(state.totalXp);
  const newAchievements: string[] = [];
  const xpGained = correctCount * EDUCATION_XP.QUIZ_CORRECT_ANSWER;

  const previous = state.moduleQuizResults[moduleId];
  const bestCorrectCount = Math.max(previous?.bestCorrectCount ?? 0, correctCount);

  let next = addXp(
    {
      ...state,
      moduleQuizResults: {
        ...state.moduleQuizResults,
        [moduleId]: {
          lastAttemptAt: new Date().toISOString(),
          correctCount,
          totalCount,
          bestCorrectCount,
        },
      },
    },
    xpGained,
  );

  if (correctCount === totalCount && totalCount > 0) {
    next = awardAchievement(next, getQuizPerfectAchievementId(quizId), newAchievements);
  }

  await writeEducationProgress(next);
  const newLevel = levelFromXp(next.totalXp);

  return {
    state: next,
    xpGained,
    leveledUp: newLevel > previousLevel,
    previousLevel,
    newLevel,
    newAchievements,
  };
}

export function isLessonCompleted(state: EducationProgressState, lessonId: string): boolean {
  return Boolean(state.completedLessons[lessonId]);
}

export function isModuleCompleted(state: EducationProgressState, moduleId: string): boolean {
  return Boolean(state.completedModules[moduleId]);
}

export function hasTakenModuleQuiz(state: EducationProgressState, moduleId: string): boolean {
  return Boolean(state.moduleQuizResults[moduleId]);
}

export function countCompletedLessons(
  state: EducationProgressState,
  lessonIds: string[],
): number {
  return lessonIds.filter((id) => isLessonCompleted(state, id)).length;
}

export function areAllLessonsCompleted(
  state: EducationProgressState,
  lessonIds: string[],
): boolean {
  return lessonIds.length > 0 && countCompletedLessons(state, lessonIds) === lessonIds.length;
}

export function getModuleQuizBestScore(
  state: EducationProgressState,
  moduleId: string,
): number | null {
  return state.moduleQuizResults[moduleId]?.bestCorrectCount ?? null;
}

export function hasTakenCategoryQuiz(state: EducationProgressState, categoryId: string): boolean {
  return Boolean(state.categoryQuizResults[categoryId]);
}

export function getCategoryQuizBestScore(
  state: EducationProgressState,
  categoryId: string,
): number | null {
  return state.categoryQuizResults[categoryId]?.bestCorrectCount ?? null;
}

export function areAllCategoryLessonsCompleted(
  state: EducationProgressState,
  moduleLessonIds: string[][],
): boolean {
  const allLessonIds = moduleLessonIds.flat();
  return areAllLessonsCompleted(state, allLessonIds);
}

export function getEarnedAchievementIds(state: EducationProgressState): string[] {
  return Object.keys(state.earnedAchievements);
}

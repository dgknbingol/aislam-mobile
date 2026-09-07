export const EDUCATION_XP = {
  LESSON_COMPLETE: 10,
  MODULE_COMPLETE_BONUS: 20,
  QUIZ_CORRECT_ANSWER: 5,
  XP_PER_LEVEL: 100,
} as const;

export function levelFromTotalXp(totalXp: number): number {
  return Math.floor(totalXp / EDUCATION_XP.XP_PER_LEVEL) + 1;
}

export function xpProgressInLevel(totalXp: number): {
  current: number;
  required: number;
  percent: number;
} {
  const current = totalXp % EDUCATION_XP.XP_PER_LEVEL;
  const required = EDUCATION_XP.XP_PER_LEVEL;
  return {
    current,
    required,
    percent: (current / required) * 100,
  };
}

export function xpToNextLevel(totalXp: number): number {
  return EDUCATION_XP.XP_PER_LEVEL - (totalXp % EDUCATION_XP.XP_PER_LEVEL);
}

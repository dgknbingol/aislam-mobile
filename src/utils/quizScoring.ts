export const QUIZ_SESSION_SIZE = 10;
export const QUIZ_QUESTION_TIME_SEC = 20;
export const QUIZ_MAX_POINTS_PER_QUESTION = 100;
export const QUIZ_QUESTION_TIME_MS = QUIZ_QUESTION_TIME_SEC * 1000;

export interface QuizAnswerRecord {
  questionId: string;
  optionId: string | null;
  responseTimeMs: number;
  isCorrect: boolean;
  points: number;
  timedOut: boolean;
}

export function clampResponseTimeMs(responseTimeMs: number): number {
  return Math.min(Math.max(responseTimeMs, 0), QUIZ_QUESTION_TIME_MS);
}

/** Linear: faster answers earn more, max 100 at 0 ms, 0 at 20 s. */
export function calculateQuestionPoints(isCorrect: boolean, responseTimeMs: number): number {
  if (!isCorrect) return 0;

  const clampedMs = clampResponseTimeMs(responseTimeMs);
  const remainingRatio = (QUIZ_QUESTION_TIME_MS - clampedMs) / QUIZ_QUESTION_TIME_MS;
  return Math.round(QUIZ_MAX_POINTS_PER_QUESTION * remainingRatio);
}

export function countCorrectAnswers(records: QuizAnswerRecord[]): number {
  return records.filter((record) => record.isCorrect).length;
}

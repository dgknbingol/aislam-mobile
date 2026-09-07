export interface QuizOption {
  id: string;
  label: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  category: string;
  options: QuizOption[];
}

export interface QuizAnswerCheckResult {
  correct: boolean;
  correctOptionId: string;
  points: number;
}

export { QUIZ_SESSION_SIZE, QUIZ_MAX_POINTS_PER_QUESTION, QUIZ_QUESTION_TIME_SEC, QUIZ_QUESTION_TIME_MS } from '../utils/quizScoring';
export type { QuizAnswerRecord } from '../utils/quizScoring';

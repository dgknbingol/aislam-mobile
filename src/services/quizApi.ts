import { AI_CONFIG } from '../config/ai';
import type { QuizAnswerCheckResult, QuizQuestion } from '../types/quiz';

function baseUrl(): string {
  return AI_CONFIG.ragBaseUrl.replace(/\/$/, '');
}

export async function fetchQuizQuestions(): Promise<QuizQuestion[]> {
  const response = await fetch(`${baseUrl()}/api/quiz/questions`);
  if (!response.ok) {
    throw new Error('Sorular yüklenemedi.');
  }
  return response.json() as Promise<QuizQuestion[]>;
}

export async function checkQuizAnswer(
  questionId: string,
  optionId: string,
  responseTimeMs: number,
): Promise<QuizAnswerCheckResult> {
  const response = await fetch(`${baseUrl()}/api/quiz/questions/${questionId}/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ optionId, responseTimeMs }),
  });

  if (!response.ok) {
    throw new Error('Cevap doğrulanamadı.');
  }

  return response.json() as Promise<QuizAnswerCheckResult>;
}

export function pickSessionQuestions(
  questions: QuizQuestion[],
  count: number,
): QuizQuestion[] {
  const shuffled = [...questions];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

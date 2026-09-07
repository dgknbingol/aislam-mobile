import { AI_CONFIG } from '../config/ai';
import type { EducationCatalog, EducationQuizDetail, EducationTopicDetail } from '../types/education';

function baseUrl(): string {
  return AI_CONFIG.ragBaseUrl.replace(/\/$/, '');
}

async function parseError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string };
    return body.message ?? `İstek başarısız (${response.status})`;
  } catch {
    return `İstek başarısız (${response.status})`;
  }
}

export class EducationApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EducationApiError';
  }
}

export async function fetchEducationCatalog(): Promise<EducationCatalog> {
  const response = await fetch(`${baseUrl()}/api/education/catalog`);
  if (!response.ok) {
    throw new EducationApiError(await parseError(response));
  }
  return (await response.json()) as EducationCatalog;
}

export async function fetchEducationTopic(topicId: string): Promise<EducationTopicDetail> {
  const response = await fetch(`${baseUrl()}/api/education/topics/${encodeURIComponent(topicId)}`);
  if (!response.ok) {
    throw new EducationApiError(await parseError(response));
  }
  return (await response.json()) as EducationTopicDetail;
}

export async function fetchEducationQuiz(quizId: string): Promise<EducationQuizDetail> {
  const response = await fetch(`${baseUrl()}/api/education/quizzes/${encodeURIComponent(quizId)}`);
  if (!response.ok) {
    throw new EducationApiError(await parseError(response));
  }
  return (await response.json()) as EducationQuizDetail;
}

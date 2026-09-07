import { AI_CONFIG } from '../config/ai';
import { ensureAppUserId } from './appUserStorage';

export interface QuizPlayer {
  playerId: string;
  displayName: string;
}

export interface QuizParticipation {
  participated: boolean;
  prizeEligibleAtJoin: boolean;
}

export interface QuizAttemptStatus {
  participated: boolean;
  completed: boolean;
  score: number;
  correctCount: number;
  questionCount: number;
  prizeEligibleAtJoin: boolean;
}

export interface LeaderboardEntryDto {
  id: string;
  name: string;
  score: number;
  initials: string;
  accent: string;
}

export interface MonthlyLeaderboardDto {
  entries: LeaderboardEntryDto[];
  currentPlayerId: string;
  currentPlayer: LeaderboardEntryDto | null;
  currentRank: number;
  totalPlayers: number;
}

export interface MonthlyStatsDto {
  monthKey: string;
  monthLabel: string;
  totalScore: number;
  rank: number;
  totalPlayers: number;
  quizzesCompleted: number;
  bestDailyScore: number;
  currentMonth: boolean;
}

export interface AchievementBadgeDto {
  id: string;
  title: string;
  description: string;
  icon: 'trophy' | 'flame' | 'star' | 'ribbon' | 'medal';
  unlocked: boolean;
}

export interface AchievementHighlightsDto {
  currentStreakDays: number;
  bestRankThisYear: number;
  lifetimeScore: number;
  quizzesThisMonth: number;
}

export interface QuizAchievementsDto {
  monthlyHistory: MonthlyStatsDto[];
  highlights: AchievementHighlightsDto;
  badges: AchievementBadgeDto[];
}

function baseUrl(): string {
  return AI_CONFIG.ragBaseUrl.replace(/\/$/, '');
}

async function buildHeaders(): Promise<Record<string, string>> {
  const appUserId = await ensureAppUserId();
  return {
    'Content-Type': 'application/json',
    'X-App-User-Id': appUserId,
  };
}

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Quiz stats API failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export async function registerQuizPlayer(params: {
  playerId: string | null;
  displayName: string;
}): Promise<QuizPlayer> {
  const response = await fetch(`${baseUrl()}/api/quiz/players/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      playerId: params.playerId,
      displayName: params.displayName,
    }),
  });

  return parseJson<QuizPlayer>(response);
}

export async function registerQuizParticipation(params: {
  playerId: string;
  eventId: string;
}): Promise<QuizParticipation> {
  const response = await fetch(`${baseUrl()}/api/quiz/participations`, {
    method: 'POST',
    headers: await buildHeaders(),
    body: JSON.stringify(params),
  });

  return parseJson<QuizParticipation>(response);
}

export async function submitQuizAttempt(params: {
  playerId: string;
  eventId: string;
  score: number;
  correctCount: number;
  questionCount: number;
}): Promise<QuizAttemptStatus> {
  const response = await fetch(`${baseUrl()}/api/quiz/attempts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  return parseJson<QuizAttemptStatus>(response);
}

export async function fetchQuizAttemptStatus(
  playerId: string,
  eventId: string,
): Promise<QuizAttemptStatus> {
  const query = new URLSearchParams({ playerId, eventId });
  const response = await fetch(`${baseUrl()}/api/quiz/attempts/status?${query.toString()}`);
  return parseJson<QuizAttemptStatus>(response);
}

export async function fetchMonthlyLeaderboard(
  playerId: string,
  limit = 10,
): Promise<MonthlyLeaderboardDto> {
  const query = new URLSearchParams({
    playerId,
    limit: String(limit),
  });
  const response = await fetch(`${baseUrl()}/api/quiz/leaderboard/monthly?${query.toString()}`);
  return parseJson<MonthlyLeaderboardDto>(response);
}

export async function fetchQuizAchievements(playerId: string): Promise<QuizAchievementsDto> {
  const query = new URLSearchParams({ playerId });
  const response = await fetch(`${baseUrl()}/api/quiz/achievements?${query.toString()}`);
  return parseJson<QuizAchievementsDto>(response);
}

import type { CurrentUserRank, LeaderboardEntry } from '../components/quiz/leaderboardMockData';
import type { MonthlyLeaderboardDto } from './quizStatsApi';

const DEFAULT_ACCENT = '#032A55';

export function mapMonthlyLeaderboard(dto: MonthlyLeaderboardDto): {
  topTen: LeaderboardEntry[];
  currentUser: CurrentUserRank;
  currentPlayerId: string;
} {
  const topTen: LeaderboardEntry[] = dto.entries.map((entry) => ({
    id: entry.id,
    name: entry.name,
    score: entry.score,
    initials: entry.initials,
    accent: entry.accent,
  }));

  const fallbackEntry: LeaderboardEntry = {
    id: dto.currentPlayerId,
    name: 'Sen',
    score: 0,
    initials: '??',
    accent: DEFAULT_ACCENT,
  };

  const currentUser: CurrentUserRank = {
    entry: dto.currentPlayer
      ? {
          id: dto.currentPlayer.id,
          name: dto.currentPlayer.name,
          score: dto.currentPlayer.score,
          initials: dto.currentPlayer.initials,
          accent: dto.currentPlayer.accent,
        }
      : topTen.find((entry) => entry.id === dto.currentPlayerId) ?? fallbackEntry,
    rank: dto.currentRank > 0 ? dto.currentRank : topTen.length + 1,
  };

  return {
    topTen,
    currentUser,
    currentPlayerId: dto.currentPlayerId,
  };
}

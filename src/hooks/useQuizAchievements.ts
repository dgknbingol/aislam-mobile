import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';

import {
  getAchievementBadges,
  getAchievementHighlights,
  getUserMonthlyHistory,
  type AchievementBadge,
  type AchievementHighlights,
  type UserMonthlyStats,
} from '../components/quiz/achievementsMockData';
import { syncPendingQuizAttempts } from '../services/competitionParticipationStorage';
import { ensureQuizPlayer } from '../services/playerStorage';
import { fetchQuizAchievements } from '../services/quizStatsApi';

function applyMockFallback(
  setHistory: (value: UserMonthlyStats[]) => void,
  setHighlights: (value: AchievementHighlights) => void,
  setBadges: (value: AchievementBadge[]) => void,
): void {
  setHistory(getUserMonthlyHistory());
  setHighlights(getAchievementHighlights());
  setBadges(getAchievementBadges());
}

export function useQuizAchievements() {
  const [history, setHistory] = useState<UserMonthlyStats[]>([]);
  const [highlights, setHighlights] = useState<AchievementHighlights | null>(null);
  const [badges, setBadges] = useState<AchievementBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromApi, setFromApi] = useState(false);
  const fromApiRef = useRef(false);

  const refresh = useCallback(async () => {
    const showLoading = !fromApiRef.current;
    if (showLoading) {
      setLoading(true);
    }

    try {
      await syncPendingQuizAttempts();
      const player = await ensureQuizPlayer();
      const dto = await fetchQuizAchievements(player.playerId);

      setHistory(
        dto.monthlyHistory.map((item) => ({
          monthKey: item.monthKey,
          monthLabel: item.monthLabel,
          totalScore: item.totalScore,
          rank: item.rank,
          totalPlayers: item.totalPlayers,
          quizzesCompleted: item.quizzesCompleted,
          bestDailyScore: item.bestDailyScore,
          isCurrentMonth: item.currentMonth,
        })),
      );
      setHighlights({
        currentStreakDays: dto.highlights.currentStreakDays,
        bestRankThisYear: dto.highlights.bestRankThisYear,
        lifetimeScore: dto.highlights.lifetimeScore,
        quizzesThisMonth: dto.highlights.quizzesThisMonth,
      });
      setBadges(
        dto.badges.map((badge) => ({
          id: badge.id,
          title: badge.title,
          description: badge.description,
          icon: badge.icon,
          unlocked: badge.unlocked,
        })),
      );
      fromApiRef.current = true;
      setFromApi(true);
    } catch {
      if (!fromApiRef.current) {
        applyMockFallback(setHistory, setHighlights, setBadges);
      }
      setFromApi(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return { history, highlights, badges, loading, fromApi, refresh };
}

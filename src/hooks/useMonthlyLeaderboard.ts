import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';

import {
  getCurrentUserRank,
  getLeaderboardTop10,
  type CurrentUserRank,
  type LeaderboardEntry,
} from '../components/quiz/leaderboardMockData';
import { ensureQuizPlayer } from '../services/playerStorage';
import { fetchMonthlyLeaderboard } from '../services/quizStatsApi';
import { mapMonthlyLeaderboard } from '../services/quizStatsHelpers';

const EMPTY_CURRENT_USER: CurrentUserRank = {
  entry: {
    id: 'me',
    name: 'Sen',
    score: 0,
    initials: '??',
    accent: '#032A55',
  },
  rank: 0,
};

export function useMonthlyLeaderboard() {
  const [topTen, setTopTen] = useState<LeaderboardEntry[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUserRank>(EMPTY_CURRENT_USER);
  const [currentPlayerId, setCurrentPlayerId] = useState('me');
  const [loading, setLoading] = useState(true);
  const [fromApi, setFromApi] = useState(false);
  const fromApiRef = useRef(false);

  const refresh = useCallback(async () => {
    const showLoading = !fromApiRef.current;
    if (showLoading) {
      setLoading(true);
    }

    try {
      const player = await ensureQuizPlayer();
      const dto = await fetchMonthlyLeaderboard(player.playerId);
      const mapped = mapMonthlyLeaderboard(dto);
      setTopTen(mapped.topTen);
      setCurrentUser(mapped.currentUser);
      setCurrentPlayerId(mapped.currentPlayerId);
      fromApiRef.current = true;
      setFromApi(true);
    } catch {
      if (!fromApiRef.current) {
        setTopTen(getLeaderboardTop10('monthly'));
        setCurrentUser(getCurrentUserRank('monthly'));
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

  return { topTen, currentUser, currentPlayerId, loading, fromApi, refresh };
}

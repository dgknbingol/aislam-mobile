export interface UserMonthlyStats {
  monthKey: string;
  monthLabel: string;
  totalScore: number;
  rank: number;
  totalPlayers: number;
  quizzesCompleted: number;
  bestDailyScore: number;
  isCurrentMonth: boolean;
}

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  icon: 'trophy' | 'flame' | 'star' | 'ribbon' | 'medal';
  unlocked: boolean;
}

export interface AchievementHighlights {
  currentStreakDays: number;
  bestRankThisYear: number;
  lifetimeScore: number;
  quizzesThisMonth: number;
}

const MONTHLY_HISTORY: UserMonthlyStats[] = [
  {
    monthKey: '2026-07',
    monthLabel: 'Temmuz 2026',
    totalScore: 10_200_000,
    rank: 11,
    totalPlayers: 4_820,
    quizzesCompleted: 18,
    bestDailyScore: 920,
    isCurrentMonth: true,
  },
  {
    monthKey: '2026-06',
    monthLabel: 'Haziran 2026',
    totalScore: 8_750_000,
    rank: 14,
    totalPlayers: 4_510,
    quizzesCompleted: 22,
    bestDailyScore: 880,
    isCurrentMonth: false,
  },
  {
    monthKey: '2026-05',
    monthLabel: 'Mayıs 2026',
    totalScore: 7_120_000,
    rank: 19,
    totalPlayers: 4_200,
    quizzesCompleted: 16,
    bestDailyScore: 810,
    isCurrentMonth: false,
  },
];

const BADGES: AchievementBadge[] = [
  {
    id: 'streak-5',
    title: '5 Gün Serisi',
    description: '5 gün üst üste yarışmaya katıldın',
    icon: 'flame',
    unlocked: true,
  },
  {
    id: 'top-20',
    title: 'İlk 20',
    description: 'Ay içinde ilk 20\'ye girdin',
    icon: 'medal',
    unlocked: true,
  },
  {
    id: 'perfect-day',
    title: 'Mükemmel Gün',
    description: 'Bir yarışmada tüm soruları doğru yanıtladın',
    icon: 'star',
    unlocked: false,
  },
  {
    id: 'monthly-champion',
    title: 'Ayın Birincisi',
    description: 'Aylık sıralamada 1. ol',
    icon: 'trophy',
    unlocked: false,
  },
];

export function getUserMonthlyHistory(): UserMonthlyStats[] {
  return MONTHLY_HISTORY;
}

export function getAchievementHighlights(): AchievementHighlights {
  const current = MONTHLY_HISTORY[0];
  return {
    currentStreakDays: 5,
    bestRankThisYear: 11,
    lifetimeScore: MONTHLY_HISTORY.reduce((sum, item) => sum + item.totalScore, 0),
    quizzesThisMonth: current.quizzesCompleted,
  };
}

export function getAchievementBadges(): AchievementBadge[] {
  return BADGES;
}

export function formatMonthlyScore(score: number): string {
  if (score >= 1_000_000) {
    return `${(score / 1_000_000).toFixed(1).replace('.', ',')}M`;
  }
  if (score >= 1_000) {
    return `${Math.round(score / 1_000)}k`;
  }
  return String(score);
}

export type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly';

export const CURRENT_USER_ID = 'me';

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  initials: string;
  accent: string;
}

export interface CurrentUserRank {
  entry: LeaderboardEntry;
  rank: number;
}

export const PERIOD_TABS: { id: LeaderboardPeriod; label: string }[] = [
  { id: 'daily', label: 'Günlük' },
  { id: 'weekly', label: 'Haftalık' },
  { id: 'monthly', label: 'Aylık' },
];

export function formatScore(score: number): string {
  if (score >= 1_000_000) {
    return `${(score / 1_000_000).toFixed(1).replace('.', ',')}M`;
  }
  if (score >= 1_000) {
    return `${Math.round(score / 1_000)}k`;
  }
  return String(score);
}

const DAILY: LeaderboardEntry[] = [
  { id: '1', name: 'Ahmet Y.', score: 2_500_000, initials: 'AY', accent: '#C9A227' },
  { id: '2', name: 'Fatma K.', score: 1_840_000, initials: 'FK', accent: '#D4DCE8' },
  { id: '3', name: 'Mehmet S.', score: 1_620_000, initials: 'MS', accent: '#B8860B' },
  { id: '4', name: 'Zeynep A.', score: 890_000, initials: 'ZA', accent: '#4A7BB7' },
  { id: '5', name: 'Emre D.', score: 845_000, initials: 'ED', accent: '#5E8F6E' },
  { id: '6', name: 'Ayşe T.', score: 812_000, initials: 'AT', accent: '#8B6FA8' },
  { id: '7', name: 'Can B.', score: 790_000, initials: 'CB', accent: '#A67C52' },
  { id: '8', name: 'Elif N.', score: 760_000, initials: 'EN', accent: '#6B8CAE' },
  { id: '9', name: 'Murat G.', score: 740_000, initials: 'MG', accent: '#7A6B5D' },
  { id: '10', name: 'Leyla R.', score: 720_000, initials: 'LR', accent: '#557A99' },
  { id: '11', name: 'Serkan U.', score: 680_000, initials: 'SU', accent: '#6E7F8C' },
  { id: '12', name: 'Gizem F.', score: 640_000, initials: 'GF', accent: '#8C6E7F' },
  { id: '13', name: 'Barış L.', score: 600_000, initials: 'BL', accent: '#5F7A6E' },
  { id: 'me', name: 'Demo Kullanıcı', score: 565_000, initials: 'DK', accent: '#032A55' },
  { id: '14', name: 'Tuğba M.', score: 530_000, initials: 'TM', accent: '#9A7B4F' },
];

const WEEKLY: LeaderboardEntry[] = [
  { id: '1', name: 'Yusuf H.', score: 8_200_000, initials: 'YH', accent: '#C9A227' },
  { id: '2', name: 'Hatice M.', score: 7_450_000, initials: 'HM', accent: '#D4DCE8' },
  { id: '3', name: 'Omar R.', score: 6_980_000, initials: 'OR', accent: '#B8860B' },
  { id: '4', name: 'Selin P.', score: 5_120_000, initials: 'SP', accent: '#4A7BB7' },
  { id: '5', name: 'Burak L.', score: 4_890_000, initials: 'BL', accent: '#5E8F6E' },
  { id: '6', name: 'Deniz C.', score: 4_650_000, initials: 'DC', accent: '#8B6FA8' },
  { id: '7', name: 'Ece V.', score: 4_420_000, initials: 'EV', accent: '#A67C52' },
  { id: '8', name: 'Kaan T.', score: 4_180_000, initials: 'KT', accent: '#6B8CAE' },
  { id: '9', name: 'Nil S.', score: 3_950_000, initials: 'NS', accent: '#7A6B5D' },
  { id: '10', name: 'Pınar A.', score: 3_720_000, initials: 'PA', accent: '#557A99' },
  { id: '11', name: 'Umut D.', score: 3_500_000, initials: 'UD', accent: '#6E7F8C' },
  { id: 'me', name: 'Demo Kullanıcı', score: 3_280_000, initials: 'DK', accent: '#032A55' },
  { id: '12', name: 'Aslı K.', score: 3_100_000, initials: 'AK', accent: '#8C6E7F' },
];

const MONTHLY: LeaderboardEntry[] = [
  { id: '1', name: 'Kerem A.', score: 24_500_000, initials: 'KA', accent: '#C9A227' },
  { id: '2', name: 'Merve S.', score: 21_800_000, initials: 'MS', accent: '#D4DCE8' },
  { id: '3', name: 'Ali V.', score: 19_400_000, initials: 'AV', accent: '#B8860B' },
  { id: '4', name: 'Seda Y.', score: 16_200_000, initials: 'SY', accent: '#4A7BB7' },
  { id: '5', name: 'Hakan E.', score: 15_600_000, initials: 'HE', accent: '#5E8F6E' },
  { id: '6', name: 'İrem K.', score: 14_900_000, initials: 'İK', accent: '#8B6FA8' },
  { id: '7', name: 'Tolga N.', score: 13_400_000, initials: 'TN', accent: '#A67C52' },
  { id: '8', name: 'Ceren B.', score: 12_800_000, initials: 'CB', accent: '#6B8CAE' },
  { id: '9', name: 'Onur P.', score: 12_100_000, initials: 'OP', accent: '#7A6B5D' },
  { id: '10', name: 'Dilara H.', score: 11_500_000, initials: 'DH', accent: '#557A99' },
  { id: 'me', name: 'Demo Kullanıcı', score: 10_200_000, initials: 'DK', accent: '#032A55' },
  { id: '11', name: 'Volkan S.', score: 9_800_000, initials: 'VS', accent: '#6E7F8C' },
];

function getFullLeaderboard(period: LeaderboardPeriod): LeaderboardEntry[] {
  switch (period) {
    case 'weekly':
      return WEEKLY;
    case 'monthly':
      return MONTHLY;
    default:
      return DAILY;
  }
}

export function getLeaderboardTop10(period: LeaderboardPeriod): LeaderboardEntry[] {
  return getFullLeaderboard(period).slice(0, 10);
}

export function getCurrentUserRank(period: LeaderboardPeriod): CurrentUserRank {
  const full = getFullLeaderboard(period);
  const index = full.findIndex((entry) => entry.id === CURRENT_USER_ID);
  if (index < 0) {
    throw new Error('Current user not found in leaderboard mock data');
  }
  return {
    entry: full[index],
    rank: index + 1,
  };
}

/** @deprecated Use getLeaderboardTop10 */
export function getLeaderboard(period: LeaderboardPeriod): LeaderboardEntry[] {
  return getLeaderboardTop10(period);
}

import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useMonthlyLeaderboard } from '../../hooks/useMonthlyLeaderboard';
import type { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { formatScore } from './leaderboardMockData';
import type { LeaderboardEntry } from './leaderboardMockData';

const RANK_COLORS = {
  1: colors.gold,
  2: '#C0C0C0',
  3: '#CD7F32',
} as const;

function TopThreeRow({
  entry,
  rank,
}: {
  entry: LeaderboardEntry;
  rank: 1 | 2 | 3;
}) {
  return (
    <View style={styles.row}>
      <View style={[styles.rankBadge, { backgroundColor: RANK_COLORS[rank] }]}>
        <Text style={styles.rankText}>{rank}</Text>
      </View>

      <View style={[styles.avatar, { backgroundColor: entry.accent }]}>
        <Text style={styles.avatarText}>{entry.initials}</Text>
      </View>

      <Text style={styles.name} numberOfLines={1}>
        {entry.name}
      </Text>

      <Text style={styles.score}>{formatScore(entry.score)}</Text>
    </View>
  );
}

export default function HomeScoreStatusSection() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { topTen, loading } = useMonthlyLeaderboard();
  const topThree = topTen.slice(0, 3);

  return (
    <View style={styles.card}>
      <View style={[styles.accent, { backgroundColor: colors.gold }]} />

      <View style={styles.content}>
        <Pressable onPress={() => navigation.navigate('Quiz')} style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.iconWrap}>
              <Ionicons name="podium-outline" size={18} color={colors.gold} />
            </View>
            <View>
              <Text style={styles.title}>Aylık Puan Durumu</Text>
              <Text style={styles.subtitle}>Bu ayın en yüksek puanlı oyuncuları</Text>
            </View>
          </View>

          <Ionicons name="chevron-forward" size={18} color={colors.textMutedOnLight} />
        </Pressable>

        {loading && topThree.length === 0 ? (
          <ActivityIndicator color={colors.gold} style={styles.loader} />
        ) : topThree.length === 0 ? (
          <Text style={styles.emptyText}>Henüz sıralama oluşmadı.</Text>
        ) : (
          <View style={styles.list}>
            {topThree.map((entry, index) => (
              <TopThreeRow key={entry.id} entry={entry} rank={(index + 1) as 1 | 2 | 3} />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: colors.textOnLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  accent: {
    width: 5,
  },
  content: {
    flex: 1,
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(201, 162, 39, 0.12)',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textOnLight,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textMutedOnLight,
  },
  list: {
    gap: 10,
  },
  loader: {
    paddingVertical: 12,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMutedOnLight,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 2,
  },
  rankBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textOnLight,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.cream,
  },
  name: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textOnLight,
  },
  score: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.gold,
  },
});

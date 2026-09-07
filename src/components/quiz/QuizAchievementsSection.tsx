import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useQuizAchievements } from '../../hooks/useQuizAchievements';
import { colors } from '../../theme/colors';
import {
  formatMonthlyScore,
  type AchievementBadge,
  type UserMonthlyStats,
} from './achievementsMockData';
import { formatScore } from './leaderboardMockData';

const BADGE_ICONS: Record<AchievementBadge['icon'], keyof typeof Ionicons.glyphMap> = {
  trophy: 'trophy-outline',
  flame: 'flame-outline',
  star: 'star-outline',
  ribbon: 'ribbon-outline',
  medal: 'medal-outline',
};

function HighlightCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.highlightCard}>
      <Ionicons name={icon} size={18} color={colors.gold} />
      <Text style={styles.highlightValue}>{value}</Text>
      <Text style={styles.highlightLabel}>{label}</Text>
    </View>
  );
}

function MonthHistoryCard({ stats }: { stats: UserMonthlyStats }) {
  return (
    <View style={[styles.monthCard, stats.isCurrentMonth && styles.monthCardCurrent]}>
      {stats.isCurrentMonth ? (
        <View style={styles.currentBadge}>
          <Text style={styles.currentBadgeText}>Bu Ay</Text>
        </View>
      ) : null}

      <Text style={styles.monthTitle}>{stats.monthLabel}</Text>

      <View style={styles.monthStatsRow}>
        <View style={styles.monthStat}>
          <Text style={styles.monthStatValue}>{formatMonthlyScore(stats.totalScore)}</Text>
          <Text style={styles.monthStatLabel}>Toplam Puan</Text>
        </View>
        <View style={styles.monthStatDivider} />
        <View style={styles.monthStat}>
          <Text style={styles.monthStatValue}>#{stats.rank}</Text>
          <Text style={styles.monthStatLabel}>Sıralama</Text>
        </View>
        <View style={styles.monthStatDivider} />
        <View style={styles.monthStat}>
          <Text style={styles.monthStatValue}>{stats.quizzesCompleted}</Text>
          <Text style={styles.monthStatLabel}>Yarışma</Text>
        </View>
      </View>

      <Text style={styles.monthMeta}>
        {stats.totalPlayers.toLocaleString('tr-TR')} oyuncu arasında · En iyi günlük {stats.bestDailyScore} puan
      </Text>
    </View>
  );
}

function BadgeCard({ badge }: { badge: AchievementBadge }) {
  return (
    <View style={[styles.badgeCard, !badge.unlocked && styles.badgeCardLocked]}>
      <View style={[styles.badgeIconWrap, badge.unlocked && styles.badgeIconWrapUnlocked]}>
        <Ionicons
          name={BADGE_ICONS[badge.icon]}
          size={22}
          color={badge.unlocked ? colors.gold : colors.creamMuted}
        />
      </View>
      <Text style={[styles.badgeTitle, !badge.unlocked && styles.badgeTitleLocked]}>{badge.title}</Text>
      <Text style={styles.badgeDescription}>{badge.description}</Text>
      {!badge.unlocked ? <Text style={styles.badgeLockedLabel}>Kilitli</Text> : null}
    </View>
  );
}

interface QuizAchievementsSectionProps {
  contentPaddingBottom: number;
}

export default function QuizAchievementsSection({ contentPaddingBottom }: QuizAchievementsSectionProps) {
  const { history, highlights, badges, loading, fromApi } = useQuizAchievements();
  const currentMonth = history.find((item) => item.isCurrentMonth) ?? history[0];

  if (loading && !fromApi) {
    return (
      <View style={[styles.loadingWrap, { paddingBottom: contentPaddingBottom }]}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  if (!currentMonth || !highlights) {
    return (
      <View style={[styles.loadingWrap, { paddingBottom: contentPaddingBottom }]}>
        <Text style={styles.emptyText}>Henüz başarı verisi yok.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: contentPaddingBottom }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heroCard}>
        <View style={styles.heroGlow} />
        <Text style={styles.heroEyebrow}>Bu Ayki Performansın</Text>
        <Text style={styles.heroScore}>{formatScore(currentMonth.totalScore)}</Text>
        <Text style={styles.heroRank}>
          {currentMonth.totalPlayers.toLocaleString('tr-TR')} kişi arasında #{currentMonth.rank}. sıradasın
        </Text>
      </View>

      <View style={styles.highlightsRow}>
        <HighlightCard
          label="Seri"
          value={`${highlights.currentStreakDays} gün`}
          icon="flame-outline"
        />
        <HighlightCard
          label="En İyi Sıra"
          value={`#${highlights.bestRankThisYear}`}
          icon="podium-outline"
        />
        <HighlightCard
          label="Bu Ay"
          value={`${highlights.quizzesThisMonth}`}
          icon="help-circle-outline"
        />
      </View>

      <Text style={styles.sectionTitle}>Aylık Geçmiş</Text>
      {history.map((item) => (
        <MonthHistoryCard key={item.monthKey} stats={item} />
      ))}

      <Text style={styles.sectionTitle}>Rozetler</Text>
      <View style={styles.badgesGrid}>
        {badges.map((badge) => (
          <BadgeCard key={badge.id} badge={badge} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  heroCard: {
    backgroundColor: colors.inputField,
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(201, 162, 39, 0.35)',
  },
  heroGlow: {
    position: 'absolute',
    top: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(201, 162, 39, 0.12)',
  },
  heroEyebrow: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.send,
    marginBottom: 8,
  },
  heroScore: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.gold,
    marginBottom: 6,
  },
  heroRank: {
    fontSize: 14,
    color: colors.creamMuted,
    textAlign: 'center',
  },
  highlightsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  highlightCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  highlightValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.cream,
  },
  highlightLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.creamMuted,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.cream,
    marginBottom: 12,
  },
  monthCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  monthCardCurrent: {
    borderColor: 'rgba(201, 162, 39, 0.45)',
    backgroundColor: 'rgba(201, 162, 39, 0.08)',
  },
  currentBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.gold,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  currentBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textOnLight,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.cream,
    marginBottom: 14,
  },
  monthStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  monthStat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  monthStatDivider: {
    width: StyleSheet.hairlineWidth,
    height: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  monthStatValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.gold,
  },
  monthStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.creamMuted,
  },
  monthMeta: {
    fontSize: 12,
    color: colors.creamMuted,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  badgeCard: {
    width: '48%',
    flexGrow: 1,
    minWidth: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  badgeCardLocked: {
    opacity: 0.72,
  },
  badgeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 10,
  },
  badgeIconWrapUnlocked: {
    backgroundColor: 'rgba(201, 162, 39, 0.16)',
  },
  badgeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.cream,
    marginBottom: 4,
  },
  badgeTitleLocked: {
    color: colors.creamMuted,
  },
  badgeDescription: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.creamMuted,
  },
  badgeLockedLabel: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: '700',
    color: colors.warning,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 14,
    color: colors.creamMuted,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});

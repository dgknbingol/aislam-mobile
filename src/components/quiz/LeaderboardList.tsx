import { FlatList, StyleSheet, Text, View } from 'react-native';

import LevelBadge from '../education/LevelBadge';
import { colors } from '../../theme/colors';
import type { CurrentUserRank, LeaderboardEntry } from './leaderboardMockData';
import { formatScore } from './leaderboardMockData';

interface LeaderboardListProps {
  entries: LeaderboardEntry[];
  currentUser: CurrentUserRank;
  contentPaddingBottom: number;
  rankOffset?: number;
  showCurrentUserFooter?: boolean;
  educationLevelXp?: number;
}

function LeaderboardRow({
  entry,
  rank,
  isCurrentUser,
  educationLevelXp,
}: {
  entry: LeaderboardEntry;
  rank: number;
  isCurrentUser: boolean;
  educationLevelXp?: number;
}) {
  return (
    <View style={[styles.row, isCurrentUser && styles.rowCurrent]}>
      <Text style={[styles.rank, isCurrentUser && styles.rankCurrent]}>
        {String(rank).padStart(2, '0')}
      </Text>

      <View style={styles.avatarWrap}>
        <View style={[styles.avatar, { backgroundColor: entry.accent }]}>
          <Text style={styles.avatarText}>{entry.initials}</Text>
        </View>
        {isCurrentUser && educationLevelXp !== undefined ? (
          <View style={styles.levelBadgeWrap}>
            <LevelBadge totalXp={educationLevelXp} compact />
          </View>
        ) : null}
      </View>

      <View style={styles.nameWrap}>
        <Text style={[styles.name, isCurrentUser && styles.nameCurrent]} numberOfLines={1}>
          {isCurrentUser ? 'Sen' : entry.name}
        </Text>
        {isCurrentUser ? <Text style={styles.youBadge}>Senin sıralaman</Text> : null}
      </View>

      <Text style={[styles.score, isCurrentUser && styles.scoreCurrent]}>
        {formatScore(entry.score)}
      </Text>
    </View>
  );
}

function LeaderboardUserFooter({
  currentUser,
  educationLevelXp,
}: {
  currentUser: CurrentUserRank;
  educationLevelXp?: number;
}) {
  return (
    <View style={styles.footer}>
      <View style={styles.footerDivider}>
        <View style={styles.footerDot} />
        <View style={styles.footerDot} />
        <View style={styles.footerDot} />
      </View>

      <View style={styles.footerCard}>
        <Text style={styles.footerLabel}>Senin sıralaman</Text>
        <View style={styles.footerRow}>
          <Text style={styles.footerRank}>{String(currentUser.rank).padStart(2, '0')}</Text>

          <View style={styles.avatarWrap}>
            <View style={[styles.avatar, { backgroundColor: currentUser.entry.accent }]}>
              <Text style={styles.avatarText}>{currentUser.entry.initials}</Text>
            </View>
            {educationLevelXp !== undefined ? (
              <View style={styles.levelBadgeWrap}>
                <LevelBadge totalXp={educationLevelXp} compact />
              </View>
            ) : null}
          </View>

          <Text style={styles.footerName} numberOfLines={1}>
            Sen
          </Text>

          <Text style={styles.footerScore}>{formatScore(currentUser.entry.score)}</Text>
        </View>
      </View>
    </View>
  );
}

export default function LeaderboardList({
  entries,
  currentUser,
  contentPaddingBottom,
  rankOffset = 4,
  showCurrentUserFooter,
  educationLevelXp,
}: LeaderboardListProps) {
  const isUserInList = entries.some((entry) => entry.id === currentUser.entry.id);
  const shouldShowFooter = showCurrentUserFooter ?? !isUserInList;

  return (
    <View style={styles.container}>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <LeaderboardRow
            entry={item}
            rank={index + rankOffset}
            isCurrentUser={item.id === currentUser.entry.id}
            educationLevelXp={item.id === currentUser.entry.id ? educationLevelXp : undefined}
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: contentPaddingBottom }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListFooterComponent={
          shouldShowFooter
            ? () => <LeaderboardUserFooter currentUser={currentUser} educationLevelXp={educationLevelXp} />
            : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.inputField,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: 18,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  rowCurrent: {
    backgroundColor: 'rgba(201, 162, 39, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
    paddingLeft: 17,
  },
  rank: {
    width: 28,
    fontSize: 15,
    fontWeight: '700',
    color: colors.creamMuted,
  },
  rankCurrent: {
    color: colors.gold,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrap: {
    position: 'relative',
  },
  levelBadgeWrap: {
    position: 'absolute',
    right: -8,
    bottom: -6,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.cream,
  },
  nameWrap: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.cream,
  },
  nameCurrent: {
    color: colors.gold,
  },
  youBadge: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.creamMuted,
    marginTop: 2,
  },
  score: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gold,
  },
  scoreCurrent: {
    color: colors.send,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginLeft: 84,
    marginRight: 20,
  },
  footer: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  footerDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  footerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  footerCard: {
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: colors.bar,
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 39, 0.35)',
  },
  footerLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.gold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  footerRank: {
    width: 28,
    fontSize: 16,
    fontWeight: '800',
    color: colors.gold,
  },
  footerName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: colors.cream,
  },
  footerScore: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.send,
  },
});

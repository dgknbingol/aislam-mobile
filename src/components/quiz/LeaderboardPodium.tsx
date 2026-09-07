import { StyleSheet, Text, View } from 'react-native';

import LevelBadge from '../education/LevelBadge';
import { colors } from '../../theme/colors';
import type { LeaderboardEntry } from './leaderboardMockData';
import { formatScore } from './leaderboardMockData';

const PODIUM_GOLD = colors.gold;
const PODIUM_SILVER = '#C0C0C0';
const PODIUM_BRONZE = '#CD7F32';

interface LeaderboardPodiumProps {
  entries: [LeaderboardEntry, LeaderboardEntry, LeaderboardEntry];
  currentUserId?: string;
  educationLevelXp?: number;
}

function PodiumAvatar({
  entry,
  rank,
  size,
  ringColor,
  isCurrentUser,
  educationLevelXp,
}: {
  entry: LeaderboardEntry;
  rank: 1 | 2 | 3;
  size: number;
  ringColor: string;
  isCurrentUser: boolean;
  educationLevelXp?: number;
}) {
  return (
    <View style={styles.avatarColumn}>
      <View style={styles.avatarWrap}>
        <View
          style={[
            styles.avatarRing,
            isCurrentUser && styles.avatarRingCurrent,
            {
              width: size + 10,
              height: size + 10,
              borderRadius: (size + 10) / 2,
              borderColor: isCurrentUser ? colors.gold : ringColor,
            },
          ]}
        >
          <View
            style={[
              styles.avatar,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: entry.accent,
              },
            ]}
          >
            <Text style={[styles.avatarText, rank === 1 && styles.avatarTextLarge]}>
              {entry.initials}
            </Text>
          </View>
        </View>
        {isCurrentUser && educationLevelXp !== undefined ? (
          <View style={styles.levelBadgeWrap}>
            <LevelBadge totalXp={educationLevelXp} compact />
          </View>
        ) : null}
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {isCurrentUser ? 'Sen' : entry.name}
      </Text>
      <Text style={styles.score}>{formatScore(entry.score)} puan</Text>
    </View>
  );
}

export default function LeaderboardPodium({
  entries,
  currentUserId,
  educationLevelXp,
}: LeaderboardPodiumProps) {
  const [second, first, third] = entries;

  return (
    <View style={styles.container}>
      <View style={styles.podiumRow}>
        <PodiumAvatar
          entry={second}
          rank={2}
          size={62}
          ringColor={PODIUM_SILVER}
          isCurrentUser={second.id === currentUserId}
          educationLevelXp={second.id === currentUserId ? educationLevelXp : undefined}
        />
        <PodiumAvatar
          entry={first}
          rank={1}
          size={78}
          ringColor={PODIUM_GOLD}
          isCurrentUser={first.id === currentUserId}
          educationLevelXp={first.id === currentUserId ? educationLevelXp : undefined}
        />
        <PodiumAvatar
          entry={third}
          rank={3}
          size={58}
          ringColor={PODIUM_BRONZE}
          isCurrentUser={third.id === currentUserId}
          educationLevelXp={third.id === currentUserId ? educationLevelXp : undefined}
        />
      </View>

      <View style={styles.blocksRow}>
        <View style={[styles.block, styles.blockSecond]}>
          <Text style={styles.blockRank}>2</Text>
        </View>
        <View style={[styles.block, styles.blockFirst]}>
          <Text style={styles.blockRank}>1</Text>
        </View>
        <View style={[styles.block, styles.blockThird]}>
          <Text style={styles.blockRank}>3</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  podiumRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  avatarColumn: {
    flex: 1,
    alignItems: 'center',
    maxWidth: 110,
    minHeight: 148,
    justifyContent: 'flex-end',
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 8,
  },
  avatarRing: {
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelBadgeWrap: {
    position: 'absolute',
    right: -10,
    bottom: -4,
  },
  avatarRingCurrent: {
    borderWidth: 3,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.cream,
  },
  avatarTextLarge: {
    fontSize: 22,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.cream,
    textAlign: 'center',
    marginBottom: 4,
  },
  score: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.gold,
    textAlign: 'center',
    marginBottom: 4,
  },
  blocksRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  block: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    maxWidth: 108,
  },
  blockFirst: {
    height: 92,
    backgroundColor: PODIUM_GOLD,
  },
  blockSecond: {
    height: 68,
    backgroundColor: PODIUM_SILVER,
  },
  blockThird: {
    height: 52,
    backgroundColor: PODIUM_BRONZE,
  },
  blockRank: {
    fontSize: 28,
    fontWeight: '800',
    color: 'rgba(2, 23, 52, 0.75)',
  },
});

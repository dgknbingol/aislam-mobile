import { StyleSheet, Text, View } from 'react-native';

import { levelFromTotalXp } from '../../constants/educationXp';
import { colors } from '../../theme/colors';

type LevelBadgeProps = {
  totalXp: number;
  compact?: boolean;
};

export default function LevelBadge({ totalXp, compact = false }: LevelBadgeProps) {
  const level = levelFromTotalXp(totalXp);

  return (
    <View style={[styles.badge, compact && styles.badgeCompact]}>
      <Text style={[styles.text, compact && styles.textCompact]}>Sv. {level}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.gold,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    minWidth: 40,
    alignItems: 'center',
  },
  badgeCompact: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 34,
  },
  text: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textOnLight,
    letterSpacing: 0.2,
  },
  textCompact: {
    fontSize: 9,
  },
});
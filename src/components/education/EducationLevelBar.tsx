import { StyleSheet, Text, View } from 'react-native';

import { levelFromTotalXp, xpProgressInLevel } from '../../constants/educationXp';
import { colors } from '../../theme/colors';

type EducationLevelBarProps = {
  totalXp: number;
};

export default function EducationLevelBar({ totalXp }: EducationLevelBarProps) {
  const level = levelFromTotalXp(totalXp);
  const progress = xpProgressInLevel(totalXp);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.levelLabel}>Seviye {level}</Text>
        <Text style={styles.xpLabel}>
          {progress.current}/{progress.required} XP
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress.percent}%` }]} />
      </View>
      <Text style={styles.hint}>Sonraki seviye için {progress.required - progress.current} XP</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.cream,
  },
  xpLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.gold,
  },
  track: {
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.gold,
  },
  hint: {
    fontSize: 12,
    color: colors.creamMuted,
  },
});

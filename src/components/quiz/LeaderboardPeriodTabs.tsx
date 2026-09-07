import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';
import type { LeaderboardPeriod } from './leaderboardMockData';
import { PERIOD_TABS } from './leaderboardMockData';

interface LeaderboardPeriodTabsProps {
  activePeriod: LeaderboardPeriod;
  onChange: (period: LeaderboardPeriod) => void;
}

export default function LeaderboardPeriodTabs({
  activePeriod,
  onChange,
}: LeaderboardPeriodTabsProps) {
  return (
    <View style={styles.container}>
      {PERIOD_TABS.map((tab) => {
        const isActive = tab.id === activePeriod;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onChange(tab.id)}
            style={[styles.tab, isActive && styles.tabActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 999,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 999,
  },
  tabActive: {
    backgroundColor: colors.cream,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.creamMuted,
  },
  tabLabelActive: {
    color: colors.textOnLight,
  },
});

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { WEEKDAY_LABELS } from '../../services/notificationSettingsStorage';
import { colors } from '../../theme/colors';

interface DaySelectorProps {
  days: boolean[];
  onChange: (days: boolean[]) => void;
}

export default function DaySelector({ days, onChange }: DaySelectorProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {WEEKDAY_LABELS.map((label, index) => {
          const active = days[index];
          return (
            <Pressable
              key={label}
              onPress={() => {
                const next = [...days];
                next[index] = !next[index];
                onChange(next);
              }}
              style={[styles.dayButton, active ? styles.dayButtonActive : styles.dayButtonInactive]}
            >
              <Text style={[styles.dayText, active ? styles.dayTextActive : styles.dayTextInactive]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  dayButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  dayButtonActive: {
    backgroundColor: colors.inputField,
    borderColor: 'rgba(201, 162, 39, 0.45)',
  },
  dayButtonInactive: {
    backgroundColor: 'rgba(2, 23, 52, 0.08)',
    borderColor: 'rgba(2, 23, 52, 0.12)',
    opacity: 0.55,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '700',
  },
  dayTextActive: {
    color: colors.cream,
  },
  dayTextInactive: {
    color: colors.textMutedOnLight,
  },
});

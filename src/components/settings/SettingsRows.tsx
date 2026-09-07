import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';

interface SettingsLinkRowProps {
  label: string;
  value?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  showDivider?: boolean;
}

export function SettingsLinkRow({
  label,
  value,
  icon,
  onPress,
  showDivider = true,
}: SettingsLinkRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      {icon ? <Ionicons name={icon} size={18} color={colors.creamMuted} style={styles.icon} /> : null}
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueWrap}>
        {value ? <Text style={styles.value}>{value}</Text> : null}
        <Ionicons name="chevron-forward" size={18} color={colors.creamMuted} />
      </View>
      {showDivider ? <View style={styles.divider} /> : null}
    </Pressable>
  );
}

interface SettingsToggleRowProps {
  label: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  showDivider?: boolean;
}

export function SettingsToggleRow({
  label,
  value,
  onValueChange,
  showDivider = true,
}: SettingsToggleRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={() => onValueChange(!value)}
        style={[styles.toggle, value && styles.toggleOn]}
        accessibilityRole="switch"
        accessibilityState={{ checked: value }}
      >
        <View style={[styles.toggleThumb, value && styles.toggleThumbOn]} />
      </Pressable>
      {showDivider ? <View style={styles.divider} /> : null}
    </View>
  );
}

interface SettingsSectionCardProps {
  title: string;
  children: React.ReactNode;
}

export function SettingsSectionCard({ title, children }: SettingsSectionCardProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMutedOnLight,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: colors.inputField,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.barBorder,
  },
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: 'relative',
  },
  rowPressed: {
    opacity: 0.85,
  },
  icon: {
    marginRight: 10,
  },
  label: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.cream,
  },
  valueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  value: {
    fontSize: 14,
    color: colors.creamMuted,
    maxWidth: 140,
  },
  divider: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    padding: 3,
    justifyContent: 'center',
  },
  toggleOn: {
    backgroundColor: '#34C759',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    transform: [{ translateX: 0 }],
  },
  toggleThumbOn: {
    transform: [{ translateX: 20 }],
  },
});

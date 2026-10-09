import { Ionicons } from '@expo/vector-icons';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

type GateTone = 'light' | 'dark';

interface LocationPermissionGateProps {
  title: string;
  body: string;
  primaryLabel: string;
  onPrimaryPress: () => void;
  secondaryLabel?: string;
  onSecondaryPress?: () => void;
  tone?: GateTone;
}

export default function LocationPermissionGate({
  title,
  body,
  primaryLabel,
  onPrimaryPress,
  secondaryLabel,
  onSecondaryPress,
  tone = 'light',
}: LocationPermissionGateProps) {
  const dark = tone === 'dark';

  return (
    <View style={styles.wrap}>
      <View style={[styles.iconCircle, dark && styles.iconCircleDark]}>
        <Ionicons
          name="location-outline"
          size={36}
          color={dark ? '#1FA8A0' : colors.gold}
        />
      </View>
      <Text style={[styles.title, dark && styles.titleDark]}>{title}</Text>
      <Text style={[styles.body, dark && styles.bodyDark]}>{body}</Text>
      <Pressable
        style={[styles.primaryButton, dark && styles.primaryButtonDark]}
        onPress={onPrimaryPress}
        accessibilityRole="button"
        accessibilityLabel={primaryLabel}
      >
        <Text style={[styles.primaryText, dark && styles.primaryTextDark]}>{primaryLabel}</Text>
      </Pressable>
      {secondaryLabel && onSecondaryPress ? (
        <Pressable
          style={styles.secondaryButton}
          onPress={onSecondaryPress}
          accessibilityRole="button"
          accessibilityLabel={secondaryLabel}
        >
          <Text style={[styles.secondaryText, dark && styles.secondaryTextDark]}>
            {secondaryLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Sistem ayarları (izin kalıcı reddedildiyse). */
export async function openAppSettings(): Promise<void> {
  await Linking.openSettings();
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 10,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(201, 162, 39, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconCircleDark: {
    backgroundColor: 'rgba(31, 168, 160, 0.15)',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textOnLight,
    textAlign: 'center',
  },
  titleDark: {
    color: '#F5F0E6',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMutedOnLight,
    textAlign: 'center',
    opacity: 0.85,
    marginBottom: 8,
  },
  bodyDark: {
    color: 'rgba(245, 240, 230, 0.72)',
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: colors.bar,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  primaryButtonDark: {
    backgroundColor: '#1FA8A0',
  },
  primaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.cream,
  },
  primaryTextDark: {
    color: '#FFFFFF',
  },
  secondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  secondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.goldMuted,
  },
  secondaryTextDark: {
    color: 'rgba(245, 240, 230, 0.65)',
  },
});

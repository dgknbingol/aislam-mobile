import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

interface DailyContentCardProps {
  emoji: string;
  title: string;
  body: string;
  footer: string;
  accentColor: string;
  /** Opsiyonel Arapça satır (örn. Esmaül Hüsna) */
  arabic?: string;
  onPress?: () => void;
}

export default function DailyContentCard({
  emoji,
  title,
  body,
  footer,
  accentColor,
  arabic,
  onPress,
}: DailyContentCardProps) {
  const content = (
    <>
      <View style={[styles.accent, { backgroundColor: accentColor }]} />
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.emoji}>{emoji}</Text>
          <Text style={styles.title}>{title}</Text>
        </View>
        {arabic ? <Text style={styles.arabic}>{arabic}</Text> : null}
        <Text style={styles.body}>{body}</Text>
        <Text style={[styles.footer, { color: accentColor }]}>{footer}</Text>
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        accessibilityRole="button"
      >
        {content}
      </Pressable>
    );
  }

  return <View style={styles.card}>{content}</View>;
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
  cardPressed: {
    opacity: 0.92,
  },
  accent: {
    width: 5,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  emoji: {
    fontSize: 18,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textOnLight,
  },
  arabic: {
    fontFamily: 'AmiriBold',
    fontSize: 28,
    lineHeight: 44,
    color: colors.gold,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: 8,
    includeFontPadding: true,
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textMutedOnLight,
    marginBottom: 10,
  },
  footer: {
    fontSize: 13,
    fontWeight: '600',
  },
});

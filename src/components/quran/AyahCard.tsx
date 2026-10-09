import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';
import type { AyahWithTranslation } from '../../types/quran';

interface AyahCardProps {
  ayah: AyahWithTranslation;
  isActive: boolean;
  isFavorite: boolean;
  translationLabel: string;
  onPlayPress: () => void;
  onToggleFavorite: () => void;
}

export default function AyahCard({
  ayah,
  isActive,
  isFavorite,
  translationLabel,
  onPlayPress,
  onToggleFavorite,
}: AyahCardProps) {
  return (
    <View style={[styles.card, isActive && styles.cardActive]}>
      <View style={styles.headerRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{ayah.numberInSurah}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.meta}>
            Cüz {ayah.juz} · Sayfa {ayah.page}
          </Text>
          <Pressable
            onPress={onToggleFavorite}
            style={styles.favoriteButton}
            accessibilityRole="button"
            accessibilityLabel={isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
            hitSlop={8}
          >
            <Ionicons
              name={isFavorite ? 'star' : 'star-outline'}
              size={22}
              color={isFavorite ? colors.gold : colors.goldMuted}
            />
          </Pressable>
        </View>
      </View>

      <Text style={styles.arabic}>{ayah.arabic}</Text>

      <View style={styles.divider} />

      <Text style={styles.mealLabel}>{translationLabel}</Text>
      <Text style={styles.translation}>{ayah.translation}</Text>

      <Pressable style={styles.playRow} onPress={onPlayPress} accessibilityLabel="Ayet dinle">
        <Ionicons name="play-circle-outline" size={20} color={colors.gold} />
        <Text style={styles.playHint}>Dinle</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFDF6',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(2, 23, 52, 0.08)',
  },
  cardActive: {
    borderColor: colors.gold,
    borderWidth: 1.5,
    backgroundColor: '#FFF9E8',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    minWidth: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bar,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  badgeText: {
    color: colors.cream,
    fontSize: 13,
    fontWeight: '700',
  },
  meta: {
    fontSize: 12,
    color: colors.textMutedOnLight,
    opacity: 0.75,
  },
  favoriteButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arabic: {
    fontSize: 26,
    lineHeight: 48,
    textAlign: 'right',
    writingDirection: 'rtl',
    color: colors.textOnLight,
    fontWeight: '500',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(2, 23, 52, 0.12)',
    marginVertical: 14,
  },
  mealLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.goldMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  translation: {
    fontSize: 16,
    lineHeight: 26,
    color: colors.textOnLight,
  },
  playRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 6,
  },
  playHint: {
    fontSize: 14,
    color: colors.goldMuted,
    fontWeight: '600',
  },
});

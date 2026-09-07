import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';

interface QuranMiniPlayerProps {
  surahTitle: string;
  ayahLabel: string;
  isPlaying: boolean;
  isLoading: boolean;
  onTogglePlayPause: () => void;
  onStop: () => void;
}

export default function QuranMiniPlayer({
  surahTitle,
  ayahLabel,
  isPlaying,
  isLoading,
  onTogglePlayPause,
  onStop,
}: QuranMiniPlayerProps) {
  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {surahTitle}
        </Text>
        <Text style={styles.subtitle}>{ayahLabel}</Text>
      </View>

      <View style={styles.controls}>
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.gold} />
        ) : (
          <Pressable
            onPress={onTogglePlayPause}
            style={styles.iconButton}
            accessibilityLabel={isPlaying ? 'Duraklat' : 'Devam et'}
          >
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={24} color={colors.cream} />
          </Pressable>
        )}

        <Pressable onPress={onStop} style={styles.iconButton} accessibilityLabel="Durdur">
          <Ionicons name="stop" size={22} color={colors.creamMuted} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bar,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.barBorder,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.cream,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: colors.creamMuted,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.inputField,
  },
});

import { StyleSheet, Text, View } from 'react-native';

import PressableScale from '../PressableScale';
import { getSurahNameTr } from '../../constants/surahNamesTr';
import { colors } from '../../theme/colors';
import type { SurahMeta } from '../../types/quran';

interface SurahListRowProps {
  surah: SurahMeta;
  onPress: () => void;
}

export default function SurahListRow({ surah, onPress }: SurahListRowProps) {
  const revelationLabel = surah.revelationType === 'Meccan' ? 'Mekke' : 'Medine';

  return (
    <PressableScale
      onPress={onPress}
      style={styles.wrapper}
      contentStyle={styles.row}
      baseColor="#FFFDF6"
      pressedColor="#F5EDD4"
      accessibilityLabel={`${getSurahNameTr(surah.number)} suresi`}
    >
      <View style={styles.numberBadge}>
        <Text style={styles.numberText}>{surah.number}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.title}>{getSurahNameTr(surah.number)}</Text>
        <Text style={styles.subtitle}>
          {surah.numberOfAyahs} ayet · {revelationLabel}
        </Text>
      </View>

      <Text style={styles.arabicName}>{surah.name}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(2, 23, 52, 0.08)',
  },
  numberBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.bar,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  numberText: {
    color: colors.cream,
    fontSize: 15,
    fontWeight: '700',
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textOnLight,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMutedOnLight,
    opacity: 0.8,
  },
  arabicName: {
    fontSize: 18,
    color: colors.textOnLight,
    opacity: 0.85,
    marginLeft: 8,
  },
});

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../navigation/types';
import {
  getQuranRadioState,
  startQuranRadio,
  subscribeQuranRadio,
  toggleQuranRadio,
  type QuranRadioState,
} from '../services/quranRadioPlayer';
import { colors } from '../theme/colors';

export default function QuranRadioScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [radio, setRadio] = useState<QuranRadioState>(getQuranRadioState);

  useEffect(() => subscribeQuranRadio(setRadio), []);

  useFocusEffect(
    useCallback(() => {
      if (!getQuranRadioState().isPlaying && !getQuranRadioState().isLoading) {
        void startQuranRadio();
      }
    }, []),
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.iconButton}
          accessibilityLabel="Geri"
        >
          <Ionicons name="chevron-back" size={24} color={colors.cream} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Kur'an Radyo</Text>
          <Text style={styles.headerSubtitle}>Kesintisiz tilavet</Text>
        </View>
        <View style={styles.iconButton} />
      </View>

      <View style={[styles.body, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <View style={styles.disc}>
          <Ionicons name="radio" size={56} color={colors.gold} />
        </View>

        <Text style={styles.title}>Kur'an-ı Kerim</Text>

        {radio.error ? <Text style={styles.errorText}>{radio.error}</Text> : null}

        <Pressable
          onPress={() => void toggleQuranRadio()}
          style={({ pressed }) => [styles.playButton, pressed && styles.playPressed]}
          accessibilityRole="button"
          accessibilityLabel={radio.isPlaying ? 'Duraklat' : 'Dinle'}
        >
          {radio.isLoading ? (
            <ActivityIndicator color={colors.bar} />
          ) : (
            <Ionicons
              name={radio.isPlaying ? 'pause' : 'play'}
              size={36}
              color={colors.bar}
              style={!radio.isPlaying ? styles.playIconOffset : undefined}
            />
          )}
        </Pressable>

        <Text style={styles.status}>
          {radio.isLoading ? 'Bağlanıyor…' : radio.isPlaying ? 'Canlı yayın' : 'Duraklatıldı'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bar,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.barBorder,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.cream,
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: colors.creamMuted,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  disc: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(201, 162, 39, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 39, 0.35)',
    marginBottom: 28,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.cream,
    marginBottom: 28,
  },
  errorText: {
    fontSize: 14,
    color: colors.warning,
    textAlign: 'center',
    marginBottom: 16,
  },
  playButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.send,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPressed: {
    opacity: 0.85,
  },
  playIconOffset: {
    marginLeft: 4,
  },
  status: {
    marginTop: 18,
    fontSize: 14,
    fontWeight: '600',
    color: colors.cream,
  },
});

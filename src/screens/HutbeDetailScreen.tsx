import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../navigation/types';
import { syncHutbes } from '../services/hutbeApi';
import {
  formatHutbeDate,
  getHutbeById,
  type HutbeItem,
} from '../services/hutbeStorage';
import { colors } from '../theme/colors';

export default function HutbeDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'HutbeDetail'>>();
  const insets = useSafeAreaInsets();
  const [hutbe, setHutbe] = useState<HutbeItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [openError, setOpenError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      let item = await getHutbeById(route.params.hutbeId);
      if (!item) {
        try {
          await syncHutbes();
          item = await getHutbeById(route.params.hutbeId);
        } catch {
          // önbellek boş / ağ yok
        }
      }
      if (!cancelled) {
        setHutbe(item);
        setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [route.params.hutbeId]);

  const openPdf = async () => {
    if (!hutbe?.pdfUrl) return;
    setOpenError(null);
    try {
      const canOpen = await Linking.canOpenURL(hutbe.pdfUrl);
      if (!canOpen) {
        setOpenError('PDF açılamadı. Tarayıcınızı kontrol edin.');
        return;
      }
      await Linking.openURL(hutbe.pdfUrl);
    } catch {
      setOpenError('PDF açılırken bir hata oluştu.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.iconButton} accessibilityLabel="Geri">
          <Ionicons name="chevron-back" size={24} color={colors.cream} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Cuma Hutbesi</Text>
          {hutbe ? (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {formatHutbeDate(hutbe.date)}
            </Text>
          ) : null}
        </View>
        <View style={styles.iconButton} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.bar} />
        </View>
      ) : !hutbe ? (
        <View style={styles.centered}>
          <Text style={styles.muted}>Hutbe bulunamadı.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.date}>{formatHutbeDate(hutbe.date)}</Text>
          <Text style={styles.title}>{hutbe.title}</Text>
          <Text style={styles.body}>
            Bu haftanın Diyanet Cuma hutbesini PDF olarak okuyabilirsiniz. Hutbe
            cihazınızdaki Hutbeler arşivine kaydedildi.
          </Text>

          <Pressable
            onPress={() => void openPdf()}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryPressed]}
          >
            <Ionicons name="document-text-outline" size={20} color={colors.cream} />
            <Text style={styles.primaryText}>Hutbeyi aç (PDF)</Text>
          </Pressable>

          {openError ? <Text style={styles.errorText}>{openError}</Text> : null}

          <Pressable
            onPress={() => navigation.navigate('Hutbeler')}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryPressed]}
          >
            <Text style={styles.secondaryText}>Tüm hutbelere git</Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    backgroundColor: colors.bar,
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
    fontSize: 20,
    fontWeight: '800',
    color: colors.cream,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.creamMuted,
    marginTop: 2,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  date: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8B5A2B',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textOnLight,
    lineHeight: 32,
    marginBottom: 14,
  },
  body: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.textMutedOnLight,
    marginBottom: 24,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.bar,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  primaryPressed: {
    opacity: 0.9,
  },
  primaryText: {
    color: colors.cream,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 12,
  },
  secondaryPressed: {
    opacity: 0.7,
  },
  secondaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.bar,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  muted: {
    fontSize: 14,
    color: colors.textMutedOnLight,
  },
  errorText: {
    marginTop: 12,
    fontSize: 13,
    color: colors.warning,
    textAlign: 'center',
  },
});

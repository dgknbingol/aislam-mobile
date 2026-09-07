import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../navigation/types';
import { loadHutbes } from '../services/hutbeApi';
import { formatHutbeDate, type HutbeItem } from '../services/hutbeStorage';
import { colors } from '../theme/colors';

export default function HutbeListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<HutbeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);
    try {
      const list = await loadHutbes(!refresh);
      setItems(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hutbeler yüklenemedi');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load(false);
    }, [load]),
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.iconButton} accessibilityLabel="Geri">
          <Ionicons name="chevron-back" size={24} color={colors.cream} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Hutbeler</Text>
          <Text style={styles.headerSubtitle}>Diyanet Cuma hutbeleri</Text>
        </View>
        <Pressable
          onPress={() => void load(true)}
          style={styles.iconButton}
          accessibilityLabel="Yenile"
        >
          <Ionicons name="refresh-outline" size={22} color={colors.cream} />
        </Pressable>
      </View>

      {isLoading && items.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.bar} />
          <Text style={styles.muted}>Hutbeler yükleniyor...</Text>
        </View>
      ) : error && items.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => void load(true)} style={styles.retryButton}>
            <Text style={styles.retryText}>Tekrar dene</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          refreshing={isRefreshing}
          onRefresh={() => void load(true)}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            error ? <Text style={styles.bannerError}>{error}</Text> : null
          }
          renderItem={({ item, index }) => (
            <Pressable
              onPress={() => navigation.navigate('HutbeDetail', { hutbeId: item.id })}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            >
              <View style={styles.dateColumn}>
                <Text style={styles.dateLabel}>{formatHutbeDate(item.date)}</Text>
                {index === 0 ? <Text style={styles.latestBadge}>Son hutbe</Text> : null}
              </View>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMutedOnLight} />
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={styles.muted}>Henüz kayıtlı hutbe yok.</Text>
          }
          ListFooterComponent={
            <Text style={styles.footerNote}>
              Kaynak: Diyanet İşleri Başkanlığı Cuma hutbeleri. Liste cihazda saklanır.
            </Text>
          }
        />
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
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    shadowColor: colors.textOnLight,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.88,
  },
  dateColumn: {
    width: 108,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B5A2B',
  },
  latestBadge: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '700',
    color: '#2E7D4F',
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.textOnLight,
    lineHeight: 21,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  muted: {
    fontSize: 14,
    color: colors.textMutedOnLight,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: colors.warning,
    textAlign: 'center',
  },
  bannerError: {
    fontSize: 13,
    color: colors.warning,
    marginBottom: 10,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.bar,
  },
  retryText: {
    color: colors.cream,
    fontWeight: '700',
  },
  footerNote: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMutedOnLight,
    textAlign: 'center',
  },
});

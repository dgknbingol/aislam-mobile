import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import EducationProgressPanel from '../../components/education/EducationProgressPanel';
import type { EducationStackParamList } from '../../navigation/types';
import { useEducationCatalog } from '../../hooks/useEducationCatalog';
import { colors } from '../../theme/colors';

type HubView = 'catalog' | 'progress';

function HubTabs({ activeView, onChange }: { activeView: HubView; onChange: (view: HubView) => void }) {
  return (
    <View style={styles.hubTabs}>
      <Pressable
        onPress={() => onChange('catalog')}
        style={[styles.hubTab, activeView === 'catalog' && styles.hubTabActive]}
      >
        <Ionicons
          name="book-outline"
          size={16}
          color={activeView === 'catalog' ? colors.textOnLight : colors.creamMuted}
        />
        <Text style={[styles.hubTabText, activeView === 'catalog' && styles.hubTabTextActive]}>Eğitimler</Text>
      </Pressable>

      <Pressable
        onPress={() => onChange('progress')}
        style={[styles.hubTab, activeView === 'progress' && styles.hubTabActive]}
      >
        <Ionicons
          name="trending-up-outline"
          size={16}
          color={activeView === 'progress' ? colors.textOnLight : colors.creamMuted}
        />
        <Text style={[styles.hubTabText, activeView === 'progress' && styles.hubTabTextActive]}>İlerlemem</Text>
      </Pressable>
    </View>
  );
}

export default function EducationHubScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<EducationStackParamList>>();
  const insets = useSafeAreaInsets();
  const [activeView, setActiveView] = useState<HubView>('catalog');
  const { catalog, isLoading, error, isOfflineFallback, refresh, isRefreshing } = useEducationCatalog();

  const lessonCount =
    catalog?.categories.reduce(
      (sum, category) =>
        sum + category.modules.reduce((moduleSum, module) => moduleSum + module.lessons.length, 0),
      0,
    ) ?? 0;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.iconButton} accessibilityLabel="Geri">
          <Ionicons name="chevron-back" size={24} color={colors.cream} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Eğitim Merkezi</Text>
          <Text style={styles.headerSubtitle}>
            {catalog
              ? `${catalog.categories.length} kategori · ${lessonCount} ders`
              : 'Yükleniyor...'}
          </Text>
        </View>
        <Pressable onPress={() => void refresh()} style={styles.iconButton} accessibilityLabel="Yenile">
          <Ionicons name="refresh-outline" size={22} color={colors.cream} />
        </Pressable>
      </View>

      <HubTabs activeView={activeView} onChange={setActiveView} />

      {activeView === 'catalog' ? (
        isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.bar} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
            showsVerticalScrollIndicator={false}
          >
            {error ? (
              <Text style={[styles.banner, isOfflineFallback && styles.bannerOffline]}>{error}</Text>
            ) : null}

            <Text style={styles.intro}>
              Dersleri oku, ilerlemeni takip et ve quizlerle XP kazan.
            </Text>

            {catalog?.categories.map((category) => (
              <Pressable
                key={category.id}
                style={({ pressed }) => [styles.categoryCard, pressed && styles.categoryCardPressed]}
                onPress={() => navigation.navigate('EducationCategory', { categoryId: category.id })}
              >
                <View style={styles.categoryIconWrap}>
                  <Ionicons
                    name={category.icon as keyof typeof Ionicons.glyphMap}
                    size={22}
                    color={colors.gold}
                  />
                </View>
                <View style={styles.categoryText}>
                  <Text style={styles.categoryTitle}>{category.title}</Text>
                  <Text style={styles.categorySubtitle}>{category.subtitle}</Text>
                  <Text style={styles.categoryMeta}>
                    {category.modules.length} modül ·{' '}
                    {category.modules.reduce((sum, module) => sum + module.lessons.length, 0)} ders
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.creamMuted} />
              </Pressable>
            ))}

            {isRefreshing ? (
              <ActivityIndicator style={styles.refreshing} size="small" color={colors.bar} />
            ) : null}
          </ScrollView>
        )
      ) : (
        <EducationProgressPanel />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    backgroundColor: colors.bar,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.barBorder,
  },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1, paddingHorizontal: 4 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.cream },
  headerSubtitle: { fontSize: 13, color: colors.creamMuted, marginTop: 2 },
  hubTabs: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.bar,
  },
  hubTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  hubTabActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  hubTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.creamMuted,
  },
  hubTabTextActive: {
    color: colors.textOnLight,
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 16, paddingTop: 16, gap: 10 },
  intro: { fontSize: 14, lineHeight: 20, color: colors.textMutedOnLight, marginBottom: 6 },
  banner: {
    fontSize: 12,
    color: colors.warning,
    backgroundColor: 'rgba(255, 155, 122, 0.15)',
    padding: 10,
    borderRadius: 12,
  },
  bannerOffline: { color: colors.textMutedOnLight },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.bar,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.barBorder,
  },
  categoryCardPressed: { opacity: 0.9 },
  categoryIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(201, 162, 39, 0.14)',
  },
  categoryText: { flex: 1, gap: 2 },
  categoryTitle: { fontSize: 16, fontWeight: '800', color: colors.cream },
  categorySubtitle: { fontSize: 13, color: colors.creamMuted, lineHeight: 18 },
  categoryMeta: { marginTop: 2, fontSize: 12, fontWeight: '700', color: colors.gold },
  refreshing: { marginTop: 8 },
});

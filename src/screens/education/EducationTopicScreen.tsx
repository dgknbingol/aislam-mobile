import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import EducationContentRenderer from '../../components/education/EducationContentRenderer';
import type { EducationStackParamList, RootStackParamList } from '../../navigation/types';
import { useEducationCatalog } from '../../hooks/useEducationCatalog';
import { useEducationTopic } from '../../hooks/useEducationTopic';
import { useEducationProgress } from '../../hooks/useEducationProgress';
import { colors } from '../../theme/colors';

type RouteProps = RouteProp<EducationStackParamList, 'EducationLesson'>;

type RelatedLink = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

export default function EducationTopicScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<EducationStackParamList>>();
  const rootNavigation = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProps>();
  const insets = useSafeAreaInsets();
  const { topic, isLoading, error } = useEducationTopic(route.params.lessonId);
  const { getModule } = useEducationCatalog();
  const { completeLesson, isLessonCompleted, refresh } = useEducationProgress();
  const [markedComplete, setMarkedComplete] = useState(false);

  const module = getModule(route.params.categoryId, route.params.moduleId);
  const moduleLessonIds = module?.lessons.map((lesson) => lesson.id) ?? [];

  const lessonDone = isLessonCompleted(route.params.lessonId) || markedComplete;

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (lessonDone || !topic?.content?.blocks?.length) {
      return;
    }

    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const nearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 80;
    if (!nearBottom) {
      return;
    }

    setMarkedComplete(true);
    void completeLesson(route.params.lessonId, route.params.moduleId, moduleLessonIds);
  };

  const handleMarkComplete = () => {
    setMarkedComplete(true);
    void completeLesson(route.params.lessonId, route.params.moduleId, moduleLessonIds);
  };

  const relatedLinks: RelatedLink[] = [];

  if (topic) {
    if (topic.id === 'namaz' || topic.id === 'oruc' || topic.id === 'ibadet') {
      relatedLinks.push({
        label: 'Kaza takibi',
        icon: 'book-outline',
        onPress: () => rootNavigation?.navigate('KazaPrayers'),
      });
    }
    if (topic.id === 'oruc') {
      relatedLinks.push({
        label: 'Dini günler',
        icon: 'calendar-outline',
        onPress: () => rootNavigation?.navigate('ReligiousDays'),
      });
    }
    if (
      topic.id === 'elif-ba' ||
      topic.id === 'harfler' ||
      topic.id === 'mahrec' ||
      topic.id === 'tecvid' ||
      topic.id === 'kuran-okuma'
    ) {
      relatedLinks.push({
        label: "Kur'an ekranı",
        icon: 'book-outline',
        onPress: () => rootNavigation?.navigate('Quran'),
      });
    }
    if (topic.id === 'namaz') {
      relatedLinks.push({
        label: 'Ezan vakitleri',
        icon: 'time-outline',
        onPress: () => rootNavigation?.navigate('PrayerTimes'),
      });
    }
    relatedLinks.push({
      label: 'Bu konuda soru sor',
      icon: 'chatbubble-ellipses-outline',
      onPress: () => rootNavigation?.navigate('Chat'),
    });
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.iconButton} accessibilityLabel="Geri">
          <Ionicons name="chevron-back" size={24} color={colors.cream} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerCategory}>{topic?.moduleTitle ?? topic?.categoryTitle ?? 'Eğitim'}</Text>
          <Text style={styles.headerTitle}>{topic?.title ?? 'Konu'}</Text>
        </View>
        <View style={styles.iconButton} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.bar} />
        </View>
      ) : !topic ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>Konu bulunamadı.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={120}
        >
          {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

          <View style={styles.summaryCard}>
            <Text style={styles.summaryText}>{topic.summary}</Text>
            {topic.content?.readingMinutes ? (
              <Text style={styles.readingTime}>≈ {topic.content.readingMinutes} dk okuma</Text>
            ) : null}
          </View>

          {topic.content?.blocks?.length ? (
            <View style={styles.contentCard}>
              <EducationContentRenderer blocks={topic.content.blocks} />
            </View>
          ) : (
            <View style={styles.comingSoonCard}>
              <Ionicons name="document-text-outline" size={28} color={colors.gold} />
              <Text style={styles.comingSoonTitle}>İçerik hazırlanıyor</Text>
              <Text style={styles.comingSoonText}>
                Bu ders için metin içeriği yakında eklenecek. Şimdilik okundu olarak işaretleyebilirsin.
              </Text>
              {!lessonDone ? (
                <Pressable style={styles.completeButton} onPress={handleMarkComplete}>
                  <Text style={styles.completeButtonText}>Okudum, işaretle</Text>
                </Pressable>
              ) : (
                <Text style={styles.completedLabel}>Tamamlandı</Text>
              )}
            </View>
          )}

          {lessonDone ? (
            <View style={styles.completedBanner}>
              <Ionicons name="checkmark-circle" size={18} color="#86EFAC" />
              <Text style={styles.completedBannerText}>Bu ders tamamlandı</Text>
            </View>
          ) : null}

          {relatedLinks.length > 0 ? (
            <View style={styles.linksSection}>
              <Text style={styles.linksTitle}>İlgili bölümler</Text>
              {relatedLinks.map((link) => (
                <Pressable
                  key={link.label}
                  style={({ pressed }) => [styles.linkRow, pressed && styles.linkRowPressed]}
                  onPress={link.onPress}
                >
                  <Ionicons name={link.icon} size={18} color={colors.gold} />
                  <Text style={styles.linkLabel}>{link.label}</Text>
                  <Ionicons name="open-outline" size={16} color={colors.creamMuted} />
                </Pressable>
              ))}
            </View>
          ) : null}
        </ScrollView>
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
  headerCategory: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.cream, marginTop: 2 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },
  errorBanner: {
    fontSize: 12,
    color: colors.warning,
    backgroundColor: 'rgba(255, 155, 122, 0.15)',
    padding: 10,
    borderRadius: 12,
  },
  summaryCard: {
    backgroundColor: colors.bar,
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.barBorder,
    gap: 8,
  },
  summaryText: { fontSize: 15, lineHeight: 22, color: colors.cream },
  readingTime: { fontSize: 12, fontWeight: '700', color: colors.gold },
  contentCard: {
    backgroundColor: colors.bar,
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.barBorder,
  },
  comingSoonCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.barBorder,
    gap: 8,
  },
  comingSoonTitle: { fontSize: 16, fontWeight: '800', color: colors.textOnLight },
  comingSoonText: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMutedOnLight,
    textAlign: 'center',
  },
  completeButton: {
    marginTop: 8,
    backgroundColor: colors.bar,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  completeButtonText: { fontSize: 14, fontWeight: '800', color: colors.cream },
  completedLabel: { marginTop: 8, fontSize: 13, fontWeight: '700', color: '#16A34A' },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(134, 239, 172, 0.15)',
    borderRadius: 12,
    padding: 12,
  },
  completedBannerText: { fontSize: 13, fontWeight: '700', color: '#166534' },
  linksSection: { gap: 8 },
  linksTitle: { fontSize: 14, fontWeight: '800', color: colors.textOnLight, marginBottom: 2 },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.bar,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.barBorder,
  },
  linkRowPressed: { opacity: 0.9 },
  linkLabel: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.cream },
  errorText: { color: colors.textOnLight },
});

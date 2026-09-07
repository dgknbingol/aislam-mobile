import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useCallback } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { EducationStackParamList } from '../../navigation/types';
import { useEducationCatalog } from '../../hooks/useEducationCatalog';
import { useEducationProgress } from '../../hooks/useEducationProgress';
import { colors } from '../../theme/colors';

type RouteProps = RouteProp<EducationStackParamList, 'EducationCategory'>;

export default function EducationCategoryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<EducationStackParamList>>();
  const route = useRoute<RouteProps>();
  const insets = useSafeAreaInsets();
  const { getCategory, isLoading } = useEducationCatalog();
  const {
    refresh,
    hasTakenCategoryQuiz,
    countCompletedLessons,
    hasTakenModuleQuiz,
    isLessonCompleted,
  } = useEducationProgress();

  const category = getCategory(route.params.categoryId);
  /** Flat categories (Siyer, Ahlak…): one module whose lessons are listed directly. */
  const flatModule = category?.modules.length === 1 ? category.modules[0] : null;
  const moduleLessonGroups = category?.modules.map((module) => module.lessons.map((lesson) => lesson.id)) ?? [];
  const allLessonsDone =
    moduleLessonGroups.length > 0 &&
    moduleLessonGroups.every((lessonIds) => countCompletedLessons(lessonIds) === lessonIds.length);
  const categoryQuizTaken = hasTakenCategoryQuiz(route.params.categoryId);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  if (isLoading && !category) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.bar} />
      </View>
    );
  }

  if (!category) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Kategori bulunamadı.</Text>
      </View>
    );
  }

  const flatLessonIds = flatModule?.lessons.map((lesson) => lesson.id) ?? [];
  const flatCompleted = flatModule ? countCompletedLessons(flatLessonIds) : 0;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.iconButton} accessibilityLabel="Geri">
          <Ionicons name="chevron-back" size={24} color={colors.cream} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>{category.title}</Text>
          <Text style={styles.headerSubtitle}>
            {flatModule
              ? `${flatCompleted}/${flatLessonIds.length} ders tamamlandı`
              : category.subtitle}
          </Text>
        </View>
        <View style={styles.iconButton}>
          <Ionicons
            name={category.icon as keyof typeof Ionicons.glyphMap}
            size={20}
            color={colors.cream}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {flatModule
          ? flatModule.lessons.map((lesson, index) => {
              const completed = isLessonCompleted(lesson.id);
              return (
                <Pressable
                  key={lesson.id}
                  style={({ pressed }) => [styles.moduleRow, pressed && styles.moduleRowPressed]}
                  onPress={() =>
                    navigation.navigate('EducationLesson', {
                      categoryId: category.id,
                      moduleId: flatModule.id,
                      lessonId: lesson.id,
                    })
                  }
                >
                  <View style={[styles.moduleBullet, completed && styles.lessonBulletDone]}>
                    {completed ? (
                      <Ionicons name="checkmark" size={16} color={colors.gold} />
                    ) : (
                      <Text style={styles.moduleBulletText}>{index + 1}</Text>
                    )}
                  </View>
                  <View style={styles.moduleText}>
                    <Text style={styles.moduleTitle}>{lesson.title}</Text>
                    <Text style={styles.moduleSummary} numberOfLines={2}>
                      {lesson.summary}
                    </Text>
                    {lesson.hasContent ? (
                      <Text style={styles.lessonReady}>İçerik hazır</Text>
                    ) : (
                      <Text style={styles.lessonPending}>İçerik yakında</Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.creamMuted} />
                </Pressable>
              );
            })
          : category.modules.map((module, index) => {
              const lessonIds = module.lessons.map((lesson) => lesson.id);
              const completed = countCompletedLessons(lessonIds);
              const moduleQuizTaken = hasTakenModuleQuiz(module.id);
              return (
                <Pressable
                  key={module.id}
                  style={({ pressed }) => [styles.moduleRow, pressed && styles.moduleRowPressed]}
                  onPress={() =>
                    navigation.navigate('EducationModule', {
                      categoryId: category.id,
                      moduleId: module.id,
                    })
                  }
                >
                  <View style={styles.moduleBullet}>
                    <Text style={styles.moduleBulletText}>{index + 1}</Text>
                  </View>
                  <View style={styles.moduleText}>
                    <Text style={styles.moduleTitle}>{module.title}</Text>
                    <Text style={styles.moduleSummary} numberOfLines={2}>
                      {module.summary}
                    </Text>
                    <Text style={styles.moduleProgress}>
                      {completed}/{lessonIds.length} ders
                      {moduleQuizTaken ? ' · quiz oynandı' : ''}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.creamMuted} />
                </Pressable>
              );
            })}

        {category.quiz ? (
          <Pressable
            style={({ pressed }) => [
              styles.quizCard,
              !allLessonsDone && styles.quizCardLocked,
              pressed && allLessonsDone && styles.moduleRowPressed,
            ]}
            disabled={!allLessonsDone}
            onPress={() =>
              navigation.navigate('EducationCategoryQuiz', {
                categoryId: category.id,
                quizId: category.quiz!.id,
              })
            }
          >
            <Ionicons
              name={categoryQuizTaken ? 'refresh-circle' : allLessonsDone ? 'ribbon' : 'lock-closed'}
              size={22}
              color={allLessonsDone ? colors.gold : colors.creamMuted}
            />
            <View style={styles.quizText}>
              <Text style={styles.quizTitle}>{category.quiz.title}</Text>
              <Text style={styles.quizSubtitle}>
                {allLessonsDone
                  ? categoryQuizTaken
                    ? `${category.quiz.questionCount} soru · tekrar oynanabilir`
                    : `${category.quiz.questionCount} soru · her doğru +5 XP`
                  : 'Tüm dersler tamamlanınca açılır'}
              </Text>
            </View>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { alignItems: 'center', justifyContent: 'center' },
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
  content: { paddingHorizontal: 16, paddingTop: 16, gap: 10 },
  moduleRow: {
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
  moduleRowPressed: { opacity: 0.9 },
  moduleBullet: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(201, 162, 39, 0.18)',
  },
  lessonBulletDone: { backgroundColor: 'rgba(134, 239, 172, 0.2)' },
  moduleBulletText: { fontSize: 13, fontWeight: '800', color: colors.gold },
  moduleText: { flex: 1, gap: 3 },
  moduleTitle: { fontSize: 15, fontWeight: '800', color: colors.cream },
  moduleSummary: { fontSize: 12, lineHeight: 17, color: colors.creamMuted },
  moduleProgress: { fontSize: 11, fontWeight: '700', color: '#86EFAC', marginTop: 2 },
  lessonReady: { fontSize: 11, fontWeight: '700', color: '#86EFAC', marginTop: 2 },
  lessonPending: { fontSize: 11, fontWeight: '700', color: colors.creamMuted, marginTop: 2 },
  quizCard: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.bar,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  quizCardLocked: { opacity: 0.65, borderColor: colors.barBorder },
  quizText: { flex: 1, gap: 3 },
  quizTitle: { fontSize: 15, fontWeight: '800', color: colors.cream },
  quizSubtitle: { fontSize: 12, color: colors.creamMuted },
  errorText: { color: colors.textOnLight },
});

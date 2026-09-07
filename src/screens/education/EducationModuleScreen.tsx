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

type RouteProps = RouteProp<EducationStackParamList, 'EducationModule'>;

export default function EducationModuleScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<EducationStackParamList>>();
  const route = useRoute<RouteProps>();
  const insets = useSafeAreaInsets();
  const { getModule, isLoading } = useEducationCatalog();
  const {
    refresh,
    isLessonCompleted,
    areAllLessonsCompleted,
    hasTakenModuleQuiz,
    getModuleQuizBestScore,
    countCompletedLessons,
  } = useEducationProgress();

  const module = getModule(route.params.categoryId, route.params.moduleId);
  const lessonIds = module?.lessons.map((lesson) => lesson.id) ?? [];
  const completedCount = countCompletedLessons(lessonIds);
  const allLessonsDone = areAllLessonsCompleted(lessonIds);
  const quizTaken = hasTakenModuleQuiz(route.params.moduleId);
  const bestScore = getModuleQuizBestScore(route.params.moduleId);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  if (isLoading && !module) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.bar} />
      </View>
    );
  }

  if (!module) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Modül bulunamadı.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.iconButton} accessibilityLabel="Geri">
          <Ionicons name="chevron-back" size={24} color={colors.cream} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>{module.title}</Text>
          <Text style={styles.headerSubtitle}>
            {completedCount}/{lessonIds.length} ders tamamlandı
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>{module.summary}</Text>

        {module.lessons.map((lesson, index) => {
          const completed = isLessonCompleted(lesson.id);
          return (
            <Pressable
              key={lesson.id}
              style={({ pressed }) => [styles.lessonRow, pressed && styles.lessonRowPressed]}
              onPress={() =>
                navigation.navigate('EducationLesson', {
                  categoryId: route.params.categoryId,
                  moduleId: route.params.moduleId,
                  lessonId: lesson.id,
                })
              }
            >
              <View style={[styles.lessonBullet, completed && styles.lessonBulletDone]}>
                {completed ? (
                  <Ionicons name="checkmark" size={16} color={colors.gold} />
                ) : (
                  <Text style={styles.lessonBulletText}>{index + 1}</Text>
                )}
              </View>
              <View style={styles.lessonText}>
                <Text style={styles.lessonTitle}>{lesson.title}</Text>
                <Text style={styles.lessonSummary} numberOfLines={2}>
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
        })}

        {module.quiz ? (
          <Pressable
            style={({ pressed }) => [
              styles.quizCard,
              !allLessonsDone && styles.quizCardLocked,
              pressed && allLessonsDone && styles.lessonRowPressed,
            ]}
            disabled={!allLessonsDone}
            onPress={() =>
              navigation.navigate('EducationModuleQuiz', {
                categoryId: route.params.categoryId,
                moduleId: route.params.moduleId,
                quizId: module.quiz!.id,
              })
            }
          >
            <Ionicons
              name={quizTaken ? 'refresh-circle' : allLessonsDone ? 'help-circle' : 'lock-closed'}
              size={22}
              color={allLessonsDone ? colors.gold : colors.creamMuted}
            />
            <View style={styles.quizText}>
              <Text style={styles.quizTitle}>{module.quiz.title}</Text>
              <Text style={styles.quizSubtitle}>
                {allLessonsDone
                  ? quizTaken && bestScore !== null
                    ? `${module.quiz.questionCount} soru · en iyi: ${bestScore}/${module.quiz.questionCount} · tekrar oyna`
                    : `${module.quiz.questionCount} soru · her doğru +5 XP`
                  : 'Tüm dersleri okuyunca açılır'}
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
  intro: { fontSize: 13, lineHeight: 19, color: colors.textOnLight, marginBottom: 4 },
  lessonRow: {
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
  lessonRowPressed: { opacity: 0.9 },
  lessonBullet: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(201, 162, 39, 0.18)',
  },
  lessonBulletDone: { backgroundColor: 'rgba(134, 239, 172, 0.2)' },
  lessonBulletText: { fontSize: 13, fontWeight: '800', color: colors.gold },
  lessonText: { flex: 1, gap: 3 },
  lessonTitle: { fontSize: 15, fontWeight: '800', color: colors.cream },
  lessonSummary: { fontSize: 12, lineHeight: 17, color: colors.creamMuted },
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

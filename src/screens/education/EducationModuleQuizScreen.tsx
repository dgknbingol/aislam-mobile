import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EDUCATION_ACHIEVEMENTS } from '../../constants/educationAchievements';
import { EDUCATION_XP } from '../../constants/educationXp';
import { useEducationCatalog } from '../../hooks/useEducationCatalog';
import { useEducationProgress } from '../../hooks/useEducationProgress';
import type { EducationStackParamList } from '../../navigation/types';
import { EducationApiError, fetchEducationQuiz } from '../../services/educationApi';
import type { EducationQuizDetail } from '../../types/education';
import { colors } from '../../theme/colors';

type RouteProps = RouteProp<EducationStackParamList, 'EducationModuleQuiz'>;

type OptionState = 'default' | 'correct' | 'wrong';

function getOptionState(
  optionLabel: string,
  selectedLabel: string | null,
  correctLabel: string | null,
  isLocked: boolean,
): OptionState {
  if (!isLocked) return 'default';
  if (optionLabel === correctLabel) return 'correct';
  if (optionLabel === selectedLabel) return 'wrong';
  return 'default';
}

export default function EducationModuleQuizScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<EducationStackParamList>>();
  const route = useRoute<RouteProps>();
  const insets = useSafeAreaInsets();
  const { getModule } = useEducationCatalog();
  const { submitModuleQuiz } = useEducationProgress();

  const module = getModule(route.params.categoryId, route.params.moduleId);
  const quizMeta = module?.quiz;

  const [quiz, setQuiz] = useState<EducationQuizDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [correctLabel, setCorrectLabel] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const correctCountRef = useRef(0);
  const [isFinished, setIsFinished] = useState(false);
  const [xpGained, setXpGained] = useState(0);
  const [newAchievements, setNewAchievements] = useState<string[]>([]);
  const [leveledUp, setLeveledUp] = useState(false);
  const [newLevel, setNewLevel] = useState(1);

  const loadQuiz = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchEducationQuiz(route.params.quizId);
      setQuiz(data);
    } catch (err) {
      setError(err instanceof EducationApiError ? err.message : 'Quiz yüklenemedi.');
    } finally {
      setIsLoading(false);
    }
  }, [route.params.quizId]);

  useEffect(() => {
    void loadQuiz();
  }, [loadQuiz]);

  const resetQuiz = () => {
    setQuestionIndex(0);
    setSelectedLabel(null);
    setCorrectLabel(null);
    setIsLocked(false);
    setCorrectCount(0);
    correctCountRef.current = 0;
    setIsFinished(false);
    setXpGained(0);
    setNewAchievements([]);
    setLeveledUp(false);
  };

  const currentQuestion = quiz?.questions[questionIndex];
  const totalQuestions = quiz?.questions.length ?? 0;
  const isLastQuestion = questionIndex >= totalQuestions - 1;

  const handleSelect = (label: string, isCorrect: boolean) => {
    if (isLocked || !currentQuestion) return;

    setSelectedLabel(label);
    const rightLabel = currentQuestion.options.find((option) => option.correct)?.label ?? null;
    setCorrectLabel(rightLabel);
    setIsLocked(true);
    if (isCorrect) {
      correctCountRef.current += 1;
      setCorrectCount(correctCountRef.current);
    }
  };

  const handleNext = async () => {
    if (!isLocked) return;

    if (!isLastQuestion) {
      setQuestionIndex((value) => value + 1);
      setSelectedLabel(null);
      setCorrectLabel(null);
      setIsLocked(false);
      return;
    }

    const finalCorrect = correctCountRef.current;
    const result = await submitModuleQuiz(
      route.params.moduleId,
      route.params.quizId,
      finalCorrect,
      totalQuestions,
    );

    setXpGained(result.xpGained);
    setNewAchievements(result.newAchievements);
    setLeveledUp(result.leveledUp);
    setNewLevel(result.newLevel);
    setIsFinished(true);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.iconButton} accessibilityLabel="Geri">
          <Ionicons name="chevron-back" size={24} color={colors.cream} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>{quiz?.title ?? quizMeta?.title ?? 'Mini Quiz'}</Text>
          <Text style={styles.headerSubtitle}>{module?.title}</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.bar} />
        </View>
      ) : error || !quiz || !currentQuestion ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error ?? 'Quiz bulunamadı.'}</Text>
          <Pressable style={styles.retryButton} onPress={() => void loadQuiz()}>
            <Text style={styles.retryButtonText}>Tekrar dene</Text>
          </Pressable>
        </View>
      ) : isFinished ? (
        <ScrollView
          contentContainerStyle={[styles.resultContent, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          <Ionicons name="checkmark-circle" size={48} color={colors.gold} />
          <Text style={styles.resultTitle}>Quiz tamamlandı</Text>
          <Text style={styles.resultScore}>
            {correctCount}/{totalQuestions} doğru
          </Text>
          <Text style={styles.resultXp}>+{xpGained} XP kazandın</Text>
          <Text style={styles.resultHint}>
            Her doğru cevap +{EDUCATION_XP.QUIZ_CORRECT_ANSWER} XP. İstediğin zaman tekrar oynayabilirsin.
          </Text>

          {leveledUp ? (
            <View style={styles.levelUpCard}>
              <Ionicons name="arrow-up-circle" size={22} color={colors.gold} />
              <Text style={styles.levelUpText}>Tebrikler! Seviye {newLevel} oldun.</Text>
            </View>
          ) : null}

          {newAchievements.length > 0 ? (
            <View style={styles.achievementCard}>
              <Text style={styles.achievementTitle}>Yeni başarım!</Text>
              {newAchievements.map((id) => {
                const achievement = EDUCATION_ACHIEVEMENTS[id];
                return (
                  <View key={id} style={styles.achievementRow}>
                    <Ionicons
                      name={(achievement?.icon ?? 'ribbon') as keyof typeof Ionicons.glyphMap}
                      size={20}
                      color={colors.gold}
                    />
                    <View style={styles.achievementText}>
                      <Text style={styles.achievementName}>{achievement?.title ?? 'Başarım'}</Text>
                      <Text style={styles.achievementDesc}>{achievement?.description}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null}

          <View style={styles.resultActions}>
            <Pressable style={styles.circleAction} onPress={resetQuiz} accessibilityLabel="Tekrar oyna">
              <View style={styles.circleButton}>
                <Ionicons name="refresh" size={22} color={colors.cream} />
              </View>
              <Text style={styles.circleLabel}>Tekrar oyna</Text>
            </Pressable>
            <Pressable
              style={styles.circleAction}
              onPress={() => navigation.goBack()}
              accessibilityLabel="Modüle dön"
            >
              <View style={[styles.circleButton, styles.circleButtonSecondary]}>
                <Ionicons name="arrow-back" size={22} color={colors.bar} />
              </View>
              <Text style={styles.circleLabel}>Modüle dön</Text>
            </Pressable>
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.progressRow}>
            <Text style={styles.progressText}>
              Soru {questionIndex + 1}/{totalQuestions}
            </Text>
            <Text style={styles.progressText}>{correctCount} doğru</Text>
          </View>

          <View style={styles.questionCard}>
            <Text style={styles.questionText}>{currentQuestion.question}</Text>
          </View>

          <View style={styles.options}>
            {currentQuestion.options.map((option) => {
              const state = getOptionState(option.label, selectedLabel, correctLabel, isLocked);
              return (
                <Pressable
                  key={option.label}
                  style={({ pressed }) => [
                    styles.option,
                    state === 'correct' && styles.optionCorrect,
                    state === 'wrong' && styles.optionWrong,
                    pressed && !isLocked && styles.optionPressed,
                  ]}
                  disabled={isLocked}
                  onPress={() => handleSelect(option.label, option.correct)}
                >
                  <Text style={styles.optionLabel}>{option.label.toUpperCase()}</Text>
                  <Text style={styles.optionText}>{option.text}</Text>
                </Pressable>
              );
            })}
          </View>

          {isLocked ? (
            <Pressable style={styles.primaryButton} onPress={() => void handleNext()}>
              <Text style={styles.primaryButtonText}>{isLastQuestion ? 'Sonuçları gör' : 'Sonraki soru'}</Text>
            </Pressable>
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
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.cream },
  headerSubtitle: { fontSize: 13, color: colors.creamMuted, marginTop: 2 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 12 },
  errorText: { fontSize: 14, color: colors.textOnLight, textAlign: 'center' },
  retryButton: {
    backgroundColor: colors.bar,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  retryButtonText: { fontSize: 14, fontWeight: '800', color: colors.cream },
  content: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressText: { fontSize: 13, fontWeight: '700', color: colors.textMutedOnLight },
  questionCard: {
    backgroundColor: colors.bar,
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.barBorder,
  },
  questionText: { fontSize: 16, lineHeight: 24, fontWeight: '700', color: colors.cream },
  options: { gap: 10 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.barBorder,
  },
  optionPressed: { opacity: 0.9 },
  optionCorrect: { borderColor: '#16A34A', backgroundColor: 'rgba(134, 239, 172, 0.2)' },
  optionWrong: { borderColor: '#DC2626', backgroundColor: 'rgba(248, 113, 113, 0.15)' },
  optionLabel: {
    width: 28,
    height: 28,
    borderRadius: 8,
    textAlign: 'center',
    lineHeight: 28,
    fontSize: 12,
    fontWeight: '800',
    color: colors.gold,
    backgroundColor: 'rgba(201, 162, 39, 0.14)',
    overflow: 'hidden',
  },
  optionText: { flex: 1, fontSize: 14, lineHeight: 20, color: colors.textOnLight },
  primaryButton: {
    marginTop: 8,
    backgroundColor: colors.bar,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: { fontSize: 15, fontWeight: '800', color: colors.cream },
  resultActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 28,
    marginTop: 16,
    width: '100%',
  },
  circleAction: {
    alignItems: 'center',
    gap: 8,
    minWidth: 88,
  },
  circleButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bar,
    borderWidth: 1.5,
    borderColor: colors.gold,
  },
  circleButtonSecondary: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.barBorder,
  },
  circleLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textOnLight,
    textAlign: 'center',
  },
  secondaryButton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.barBorder,
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonText: { fontSize: 15, fontWeight: '700', color: colors.textOnLight },
  resultContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    alignItems: 'center',
    gap: 10,
  },
  resultTitle: { fontSize: 22, fontWeight: '800', color: colors.textOnLight },
  resultScore: { fontSize: 18, fontWeight: '700', color: colors.gold },
  resultXp: { fontSize: 16, fontWeight: '800', color: '#16A34A' },
  resultHint: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMutedOnLight,
    textAlign: 'center',
    marginBottom: 8,
  },
  levelUpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(201, 162, 39, 0.15)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  levelUpText: { fontSize: 14, fontWeight: '800', color: colors.textOnLight },
  achievementCard: {
    width: '100%',
    backgroundColor: colors.bar,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  achievementTitle: { fontSize: 14, fontWeight: '800', color: colors.gold },
  achievementRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  achievementText: { flex: 1, gap: 2 },
  achievementName: { fontSize: 14, fontWeight: '800', color: colors.cream },
  achievementDesc: { fontSize: 12, lineHeight: 17, color: colors.creamMuted },
});

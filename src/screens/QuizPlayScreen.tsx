import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { LeaderboardPeriod } from '../components/quiz/leaderboardMockData';
import QuizPrizeClaimCard from '../components/quiz/QuizPrizeClaimCard';
import { COMPETITION_PRIZE_TOP_RANK } from '../constants/competition';
import { useQuestionTimer } from '../hooks/useQuestionTimer';
import type { RootStackParamList } from '../navigation/types';
import { checkQuizAnswer, fetchQuizQuestions, pickSessionQuestions } from '../services/quizApi';
import {
  getCompetitionParticipation,
  getCompetitionParticipationWithSync,
  markCompetitionCompleted,
} from '../services/competitionParticipationStorage';
import { ensureQuizPlayer } from '../services/playerStorage';
import { fetchMonthlyLeaderboard, submitQuizAttempt } from '../services/quizStatsApi';
import { showInterstitialIfEligible } from '../services/fullscreenAds';
import { useSubscription } from '../context/SubscriptionContext';
import { colors } from '../theme/colors';
import type { QuizAnswerRecord } from '../types/quiz';
import { QUIZ_QUESTION_TIME_MS, QUIZ_SESSION_SIZE } from '../utils/quizScoring';
import {
  calculateQuestionPoints,
  clampResponseTimeMs,
  countCorrectAnswers,
} from '../utils/quizScoring';

const PERIOD_TITLES: Record<LeaderboardPeriod, string> = {
  daily: 'Günlük Bilgi Yarışması',
  weekly: 'Haftalık Bilgi Yarışması',
  monthly: 'Aylık Bilgi Yarışması',
};

const AUTO_ADVANCE_AFTER_ANSWER_MS = 1200;
const AUTO_ADVANCE_AFTER_TIMEOUT_MS = 800;

type OptionVisualState = 'default' | 'pending' | 'correct' | 'wrong';

function formatCategory(category: string): string {
  if (!category) return 'Genel';
  return category.charAt(0).toUpperCase() + category.slice(1);
}

function getOptionState(
  optionId: string,
  selectedOptionId: string | null,
  correctOptionId: string | null,
  isLocked: boolean,
): OptionVisualState {
  if (!isLocked) return 'default';
  if (correctOptionId === null) {
    return optionId === selectedOptionId ? 'pending' : 'default';
  }
  if (optionId === correctOptionId) return 'correct';
  if (optionId === selectedOptionId) return 'wrong';
  return 'default';
}

export default function QuizPlayScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'QuizPlay'>>();
  const insets = useSafeAreaInsets();
  const { quota } = useSubscription();
  const period = route.params.period;
  const eventId = route.params.eventId;

  const [questions, setQuestions] = useState<Awaited<ReturnType<typeof fetchQuizQuestions>>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answerRecords, setAnswerRecords] = useState<QuizAnswerRecord[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [correctOptionId, setCorrectOptionId] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [lastEarnedPoints, setLastEarnedPoints] = useState<number | null>(null);
  const [monthlyRank, setMonthlyRank] = useState<number | null>(null);
  const [prizeEligibleAtJoin, setPrizeEligibleAtJoin] = useState(false);

  const questionStartedAtRef = useRef<number>(Date.now());
  const isLockedRef = useRef(false);
  const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentQuestionRef = useRef<(typeof questions)[number] | undefined>(undefined);

  const currentQuestion = questions[currentIndex];
  currentQuestionRef.current = currentQuestion;
  isLockedRef.current = isLocked;

  const totalQuestions = questions.length;
  const isLastQuestion = currentIndex >= totalQuestions - 1;

  const clearAdvanceTimeout = useCallback(() => {
    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }
  }, []);

  const resetQuestionState = useCallback(() => {
    setSelectedOptionId(null);
    setCorrectOptionId(null);
    setIsLocked(false);
    setTimedOut(false);
    setLastEarnedPoints(null);
    setError(null);
    questionStartedAtRef.current = Date.now();
  }, []);

  const advanceToNext = useCallback(() => {
    clearAdvanceTimeout();

    if (isLastQuestion) {
      setIsFinished(true);
      return;
    }

    setCurrentIndex((prev) => prev + 1);
    resetQuestionState();
  }, [clearAdvanceTimeout, isLastQuestion, resetQuestionState]);

  const scheduleAdvance = useCallback(
    (delayMs: number) => {
      clearAdvanceTimeout();
      advanceTimeoutRef.current = setTimeout(advanceToNext, delayMs);
    },
    [advanceToNext, clearAdvanceTimeout],
  );

  const handleTimeout = useCallback(() => {
    if (isLockedRef.current) return;

    const question = currentQuestionRef.current;
    if (!question) return;

    isLockedRef.current = true;
    setIsLocked(true);
    setTimedOut(true);

    setAnswerRecords((prev) => [
      ...prev,
      {
        questionId: question.id,
        optionId: null,
        responseTimeMs: QUIZ_QUESTION_TIME_MS,
        isCorrect: false,
        points: 0,
        timedOut: true,
      },
    ]);

    scheduleAdvance(AUTO_ADVANCE_AFTER_TIMEOUT_MS);
  }, [scheduleAdvance]);

  const timerEnabled = !isLocked && !isFinished && !!currentQuestion;

  const { remainingSec, progress, isExpired } = useQuestionTimer({
    durationMs: QUIZ_QUESTION_TIME_MS,
    questionKey: currentQuestion?.id ?? currentIndex,
    enabled: timerEnabled,
    onExpire: handleTimeout,
  });

  useEffect(() => {
    if (!isFinished) return;

    const finalCorrectCount = countCorrectAnswers(answerRecords);
    const finalQuestionCount = questions.length;

    void (async () => {
      const participation = await getCompetitionParticipation(period, eventId);
      setPrizeEligibleAtJoin(participation?.prizeEligibleAtJoin === true);

      await markCompetitionCompleted(period, eventId, score, finalCorrectCount, finalQuestionCount);

      try {
        const player = await ensureQuizPlayer();
        const attemptStatus = await submitQuizAttempt({
          playerId: player.playerId,
          eventId,
          score,
          correctCount: finalCorrectCount,
          questionCount: finalQuestionCount,
        });
        setPrizeEligibleAtJoin(attemptStatus.prizeEligibleAtJoin);

        try {
          const leaderboard = await fetchMonthlyLeaderboard(player.playerId);
          if (leaderboard.currentRank > 0) {
            setMonthlyRank(leaderboard.currentRank);
          }
        } catch {
          // Sıralama alınamazsa ödül kartı gösterilmez
        }
      } catch {
        // Offline: local kayıt yeterli
      }
    })();
  }, [answerRecords, eventId, isFinished, period, questions.length, score]);

  const leaveFinishWithAd = useCallback(
    async (target: 'Quiz' | 'Home') => {
      await showInterstitialIfEligible({ isPremium: quota?.premium === true });
      navigation.navigate(target);
    },
    [navigation, quota?.premium],
  );

  const loadQuestions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setAccessDenied(null);
    clearAdvanceTimeout();

    try {
      const participation = await getCompetitionParticipation(period, eventId);
      if (!participation?.participated) {
        setAccessDenied('Bu yarışmaya katılım bulunamadı.');
        return;
      }
      if (participation.completed) {
        setAccessDenied('Bu yarışmayı zaten tamamladın.');
        return;
      }

      const all = await fetchQuizQuestions();
      const session = pickSessionQuestions(all, QUIZ_SESSION_SIZE);
      if (session.length === 0) {
        throw new Error('Yarışma için soru bulunamadı.');
      }
      setQuestions(session);
      setCurrentIndex(0);
      setScore(0);
      setAnswerRecords([]);
      resetQuestionState();
      setIsFinished(false);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Sorular yüklenemedi.');
    } finally {
      setIsLoading(false);
    }
  }, [clearAdvanceTimeout, eventId, period, resetQuestionState]);

  useEffect(() => {
    void loadQuestions();
    return () => clearAdvanceTimeout();
  }, [clearAdvanceTimeout, loadQuestions]);

  const handleSelectOption = async (optionId: string) => {
    if (!currentQuestion || isLockedRef.current || isChecking || isExpired) return;

    const responseTimeMs = clampResponseTimeMs(Date.now() - questionStartedAtRef.current);

    isLockedRef.current = true;
    setIsChecking(true);
    setSelectedOptionId(optionId);
    setIsLocked(true);

    try {
      const result = await checkQuizAnswer(currentQuestion.id, optionId, responseTimeMs);
      const points =
        typeof result.points === 'number'
          ? result.points
          : calculateQuestionPoints(result.correct, responseTimeMs);
      setCorrectOptionId(result.correctOptionId);
      setScore((prev) => prev + points);
      setLastEarnedPoints(points);

      setAnswerRecords((prev) => [
        ...prev,
        {
          questionId: currentQuestion.id,
          optionId,
          responseTimeMs,
          isCorrect: result.correct,
          points,
          timedOut: false,
        },
      ]);

      scheduleAdvance(AUTO_ADVANCE_AFTER_ANSWER_MS);
    } catch {
      isLockedRef.current = false;
      setSelectedOptionId(null);
      setIsLocked(false);
      setError('Cevap gönderilemedi. Tekrar deneyin.');
    } finally {
      setIsChecking(false);
    }
  };

  const headerTitle = useMemo(() => PERIOD_TITLES[period], [period]);
  const correctCount = countCorrectAnswers(answerRecords);
  const timerUrgent = remainingSec <= 5 && timerEnabled;
  const isPrizeWinner =
    monthlyRank != null && monthlyRank > 0 && monthlyRank <= COMPETITION_PRIZE_TOP_RANK;

  if (isLoading) {
    return (
      <View style={[styles.centerState, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.gold} />
        <Text style={styles.stateText}>Sorular hazırlanıyor...</Text>
      </View>
    );
  }

  if (accessDenied) {
    return (
      <View style={[styles.centerState, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>{accessDenied}</Text>
        <Pressable style={styles.retryButton} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.retryText}>Ana Sayfaya Dön</Text>
        </Pressable>
      </View>
    );
  }

  if (error && !currentQuestion) {
    return (
      <View style={[styles.centerState, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={() => void loadQuestions()}>
          <Text style={styles.retryText}>Tekrar dene</Text>
        </Pressable>
        <Pressable style={styles.backLink} onPress={() => navigation.goBack()}>
          <Text style={styles.backLinkText}>Geri dön</Text>
        </Pressable>
      </View>
    );
  }

  if (isFinished) {
    return (
      <View style={styles.container}>
        <View style={[styles.finishBody, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 }]}>
          <View style={styles.finishCard}>
            <View style={styles.finishAccent} />

            <View style={styles.finishContent}>
              <View style={styles.finishTrophyWrap}>
                <View style={styles.finishTrophyGlow} />
                <View style={styles.finishTrophyIcon}>
                  <Ionicons name="trophy" size={36} color={colors.gold} />
                </View>
              </View>

              <Text style={styles.finishTitle}>Yarışma Tamamlandı!</Text>
              <Text style={styles.finishSubtitle}>Harika bir performans sergiledin</Text>

              <View style={styles.finishScoreRing}>
                <Text style={styles.finishScoreValue}>{score}</Text>
                <Text style={styles.finishScoreLabel}>puan</Text>
              </View>

              <View style={styles.finishStatsRow}>
                <Ionicons name="checkmark-circle" size={18} color="#2E7D4F" />
                <Text style={styles.finishStatValue}>{correctCount}/{totalQuestions}</Text>
                <Text style={styles.finishStatLabel}>Doğru</Text>
              </View>

              {isPrizeWinner && monthlyRank != null ? (
                <QuizPrizeClaimCard rank={monthlyRank} prizeEligibleAtJoin={prizeEligibleAtJoin} />
              ) : null}

              <View style={styles.finishActions}>
                <Pressable
                  style={({ pressed }) => [styles.finishPrimaryButton, pressed && styles.finishButtonPressed]}
                  onPress={() => void leaveFinishWithAd('Quiz')}
                >
                  <Ionicons name="podium-outline" size={20} color={colors.cream} />
                  <Text style={styles.finishPrimaryButtonText}>Sıralamayı Gör</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [styles.finishSecondaryButton, pressed && styles.finishButtonPressed]}
                  onPress={() => void leaveFinishWithAd('Home')}
                >
                  <Ionicons name="home-outline" size={18} color={colors.textOnLight} />
                  <Text style={styles.finishSecondaryButtonText}>Ana Sayfaya Dön</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerBack} accessibilityLabel="Geri">
          <Ionicons name="chevron-back" size={24} color={colors.cream} />
        </Pressable>

        <View style={styles.headerBrand}>
          <View style={styles.brandIcon}>
            <Ionicons name="help-circle" size={20} color={colors.gold} />
          </View>
          <Text style={styles.brandText} numberOfLines={1}>
            {headerTitle}
          </Text>
        </View>

        <View style={styles.scoreBadge}>
          <Ionicons name="star" size={14} color={colors.gold} />
          <Text style={styles.scoreText}>{score} puan</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>
            Soru {currentIndex + 1}/{totalQuestions}
          </Text>
          <View style={styles.timerBadge}>
            <Ionicons
              name="timer-outline"
              size={15}
              color={timerUrgent ? colors.warning : colors.gold}
            />
            <Text style={[styles.timerText, timerUrgent && styles.timerTextUrgent]}>
              {remainingSec}s
            </Text>
          </View>
        </View>

        <View style={styles.timerTrack}>
          <View
            style={[
              styles.timerFill,
              { width: `${Math.max(0, Math.min(progress, 1)) * 100}%` },
              timerUrgent && styles.timerFillUrgent,
            ]}
          />
        </View>

        <View style={styles.dotRow}>
          {questions.map((question, index) => (
            <View
              key={question.id}
              style={[
                styles.dot,
                index === currentIndex && styles.dotActive,
                index < currentIndex && styles.dotDone,
              ]}
            />
          ))}
        </View>

        {timedOut ? (
          <View style={styles.feedbackBanner}>
            <Ionicons name="time-outline" size={18} color="#C2410C" />
            <Text style={styles.feedbackBannerText}>Süre doldu</Text>
          </View>
        ) : null}

        {lastEarnedPoints != null && lastEarnedPoints > 0 ? (
          <View style={styles.pointsBanner}>
            <Ionicons name="flash" size={18} color={colors.gold} />
            <Text style={styles.pointsBannerText}>+{lastEarnedPoints} puan</Text>
          </View>
        ) : null}

        <View style={styles.questionCard}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{formatCategory(currentQuestion.category)}</Text>
          </View>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
        </View>

        <View style={styles.options}>
          {currentQuestion.options.map((option) => {
            const state = getOptionState(option.id, selectedOptionId, correctOptionId, isLocked);
            const isPending = state === 'pending';
            const isCorrect = state === 'correct';
            const isWrong = state === 'wrong';

            return (
              <Pressable
                key={option.id}
                onPress={() => void handleSelectOption(option.id)}
                disabled={isLocked || isChecking || isExpired}
                style={[
                  styles.option,
                  isPending && styles.optionPending,
                  isCorrect && styles.optionCorrect,
                  isWrong && styles.optionWrong,
                ]}
              >
                <View
                  style={[
                    styles.optionLabel,
                    isPending && styles.optionLabelPending,
                    isCorrect && styles.optionLabelCorrect,
                    isWrong && styles.optionLabelWrong,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionLabelText,
                      (isCorrect || isWrong) && styles.optionLabelTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.optionText,
                    isCorrect && styles.optionTextCorrect,
                    isWrong && styles.optionTextWrong,
                  ]}
                >
                  {option.text}
                </Text>

                {isChecking && isPending ? (
                  <ActivityIndicator size="small" color={colors.gold} />
                ) : null}
                {!isChecking && isCorrect ? (
                  <Ionicons name="checkmark-circle" size={22} color="#15803D" />
                ) : null}
                {!isChecking && isWrong ? (
                  <Ionicons name="close-circle" size={22} color="#C2410C" />
                ) : null}
              </Pressable>
            );
          })}
        </View>

        {error ? <Text style={styles.inlineError}>{error}</Text> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 24,
    gap: 12,
  },
  stateText: {
    fontSize: 14,
    color: colors.textMutedOnLight,
  },
  errorText: {
    fontSize: 14,
    color: colors.textMutedOnLight,
    textAlign: 'center',
  },
  inlineError: {
    fontSize: 13,
    color: '#C2410C',
    textAlign: 'center',
    marginBottom: 8,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.bar,
  },
  retryText: {
    color: colors.cream,
    fontWeight: '600',
  },
  backLink: {
    paddingVertical: 8,
  },
  backLinkText: {
    color: colors.textMutedOnLight,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    backgroundColor: colors.bar,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.barBorder,
    gap: 8,
  },
  headerBack: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBrand: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(201, 162, 39, 0.14)',
  },
  brandText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.cream,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(201, 162, 39, 0.14)',
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.send,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textOnLight,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(201, 162, 39, 0.12)',
  },
  timerText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.gold,
    minWidth: 28,
    textAlign: 'center',
  },
  timerTextUrgent: {
    color: '#C2410C',
  },
  timerTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(2, 23, 52, 0.08)',
    overflow: 'hidden',
    marginBottom: 12,
  },
  timerFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.gold,
  },
  timerFillUrgent: {
    backgroundColor: colors.warning,
  },
  dotRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(2, 23, 52, 0.12)',
  },
  dotActive: {
    width: 18,
    backgroundColor: colors.gold,
  },
  dotDone: {
    backgroundColor: colors.inputField,
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 155, 122, 0.18)',
  },
  feedbackBannerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9A3412',
  },
  pointsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(201, 162, 39, 0.14)',
  },
  pointsBannerText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.gold,
  },
  questionCard: {
    backgroundColor: colors.bar,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    minHeight: 140,
    justifyContent: 'center',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(201, 162, 39, 0.18)',
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.send,
  },
  questionText: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '700',
    color: colors.cream,
  },
  options: {
    gap: 10,
    marginBottom: 18,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(2, 23, 52, 0.08)',
  },
  optionPending: {
    borderColor: 'rgba(201, 162, 39, 0.45)',
    backgroundColor: 'rgba(201, 162, 39, 0.08)',
  },
  optionCorrect: {
    backgroundColor: 'rgba(46, 125, 79, 0.12)',
    borderColor: '#2E7D4F',
  },
  optionWrong: {
    backgroundColor: 'rgba(255, 155, 122, 0.18)',
    borderColor: colors.warning,
  },
  optionLabel: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(201, 162, 39, 0.14)',
  },
  optionLabelPending: {
    backgroundColor: 'rgba(201, 162, 39, 0.28)',
  },
  optionLabelCorrect: {
    backgroundColor: '#2E7D4F',
  },
  optionLabelWrong: {
    backgroundColor: colors.warning,
  },
  optionLabelText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.gold,
  },
  optionLabelTextActive: {
    color: colors.cream,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textOnLight,
  },
  optionTextCorrect: {
    color: '#166534',
  },
  optionTextWrong: {
    color: '#9A3412',
  },
  finishBody: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  finishCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: colors.textOnLight,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  finishAccent: {
    width: 5,
    backgroundColor: colors.gold,
  },
  finishContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 24,
  },
  finishTrophyWrap: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  finishTrophyGlow: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(201, 162, 39, 0.12)',
  },
  finishTrophyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(201, 162, 39, 0.08)',
    borderWidth: 2,
    borderColor: 'rgba(201, 162, 39, 0.28)',
  },
  finishTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textOnLight,
    textAlign: 'center',
  },
  finishSubtitle: {
    fontSize: 14,
    color: colors.textMutedOnLight,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  finishScoreRing: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(201, 162, 39, 0.1)',
    borderWidth: 3,
    borderColor: colors.gold,
    marginBottom: 22,
  },
  finishScoreValue: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.gold,
    lineHeight: 40,
  },
  finishScoreLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.goldMuted,
    marginTop: -2,
  },
  finishStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    backgroundColor: 'rgba(2, 23, 52, 0.04)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  finishStatValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textOnLight,
  },
  finishStatLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMutedOnLight,
  },
  finishActions: {
    width: '100%',
    gap: 10,
  },
  finishPrimaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    backgroundColor: colors.bar,
    borderRadius: 14,
    paddingVertical: 15,
    shadowColor: colors.bar,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  finishPrimaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.cream,
  },
  finishSecondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(2, 23, 52, 0.12)',
  },
  finishSecondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textOnLight,
  },
  finishButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});

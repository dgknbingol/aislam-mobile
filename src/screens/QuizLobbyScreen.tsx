import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { LeaderboardPeriod } from '../components/quiz/leaderboardMockData';
import type { RootStackParamList } from '../navigation/types';
import {
  canJoinCompetition,
  markCompetitionParticipated,
} from '../services/competitionParticipationStorage';
import { COMPETITION_PRIZE_HINT } from '../constants/competition';
import { colors } from '../theme/colors';
import {
  formatLiveCountdown,
  getCompetitionSnapshotByKind,
} from '../utils/competitionSchedule';

const PERIOD_TITLES: Record<LeaderboardPeriod, string> = {
  daily: 'Günlük Bilgi Yarışması',
  weekly: 'Haftalık Bilgi Yarışması',
  monthly: 'Aylık Bilgi Yarışması',
};

export default function QuizLobbyScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'QuizLobby'>>();
  const insets = useSafeAreaInsets();
  const period = route.params.period;

  const [snapshot, setSnapshot] = useState(() => getCompetitionSnapshotByKind(period));
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [accessDenied, setAccessDenied] = useState<string | null>(null);
  const hasStartedRef = useRef(false);

  const headerTitle = useMemo(() => PERIOD_TITLES[period], [period]);

  const startQuiz = useCallback(async () => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    const current = getCompetitionSnapshotByKind(period);
    await markCompetitionParticipated(period, current.eventId);
    navigation.replace('QuizPlay', { period, eventId: current.eventId });
  }, [navigation, period]);

  useEffect(() => {
    let cancelled = false;

    const verifyAccess = async () => {
      const current = getCompetitionSnapshotByKind(period);
      setSnapshot(current);

      if (current.phase === 'upcoming') {
        if (!cancelled) {
          setAccessDenied('Yarışma henüz başlamadı.');
          setIsCheckingAccess(false);
        }
        return;
      }

      if (current.phase === 'active') {
        if (!cancelled) {
          setAccessDenied('Maalesef yarışma başladı. Katılım süresini kaçırdın.');
          setIsCheckingAccess(false);
        }
        return;
      }

      const allowed = await canJoinCompetition(period, current.eventId);
      if (!allowed) {
        if (!cancelled) {
          setAccessDenied('Bu yarışmaya zaten katıldın.');
          setIsCheckingAccess(false);
        }
        return;
      }

      if (!cancelled) {
        setIsCheckingAccess(false);
      }

      if (current.phase === 'lobby' && current.countdownMs <= 0) {
        void startQuiz();
      }
    };

    void verifyAccess();

    return () => {
      cancelled = true;
    };
  }, [period, startQuiz]);

  useEffect(() => {
    if (isCheckingAccess || accessDenied) return;

    const tick = () => {
      const current = getCompetitionSnapshotByKind(period);
      setSnapshot(current);

      if (current.phase === 'upcoming') {
        setAccessDenied('Yarışma süresi doldu.');
        return;
      }

      if (current.phase === 'active' || (current.phase === 'lobby' && current.countdownMs <= 0)) {
        void startQuiz();
        return;
      }
    };

    tick();
    const timer = setInterval(tick, 250);
    return () => clearInterval(timer);
  }, [accessDenied, isCheckingAccess, period, startQuiz]);

  if (isCheckingAccess) {
    return (
      <View style={styles.container}>
        <View style={[styles.centerState, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <ActivityIndicator size="large" color={colors.gold} />
          <Text style={styles.stateText}>Yarışma hazırlanıyor...</Text>
        </View>
      </View>
    );
  }

  if (accessDenied) {
    return (
      <View style={styles.container}>
        <View style={[styles.centerState, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <Ionicons name="information-circle-outline" size={48} color={colors.gold} />
          <Text style={styles.deniedTitle}>{accessDenied}</Text>
          <Pressable style={styles.primaryButton} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.primaryButtonText}>Ana Sayfaya Dön</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerBack} accessibilityLabel="Geri">
          <Ionicons name="chevron-back" size={24} color={colors.cream} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {headerTitle}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={[styles.body, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.heroCard}>
          <View style={styles.heroGlow} />
          <View style={styles.heroIconWrap}>
            <Ionicons name="hourglass-outline" size={42} color={colors.gold} />
          </View>

          <Text style={styles.heroTitle}>Oyun Başlıyor</Text>
          <Text style={styles.heroSubtitle}>Hazır ol, yarışma birazdan başlayacak</Text>
          <Text style={styles.prizeHint}>{COMPETITION_PRIZE_HINT}</Text>

          <View style={styles.countdownRing}>
            <Text style={styles.countdownValue}>{formatLiveCountdown(snapshot.countdownMs)}</Text>
          </View>

          <View style={styles.tipRow}>
            <Ionicons name="bulb-outline" size={16} color={colors.send} />
            <Text style={styles.tipText}>Sorular başlayınca her biri için 20 saniyen olacak</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bar,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bar,
    paddingHorizontal: 24,
    gap: 16,
  },
  stateText: {
    fontSize: 14,
    color: colors.creamMuted,
  },
  deniedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.cream,
    textAlign: 'center',
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
  headerBack: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: colors.cream,
  },
  headerSpacer: {
    width: 40,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: colors.inputField,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: 8,
  },
  heroCard: {
    backgroundColor: colors.bar,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  heroGlow: {
    position: 'absolute',
    top: 28,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(91, 143, 201, 0.16)',
  },
  heroIconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(91, 143, 201, 0.12)',
    borderWidth: 2,
    borderColor: 'rgba(91, 143, 201, 0.32)',
    marginBottom: 18,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.cream,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: colors.creamMuted,
    textAlign: 'center',
    marginBottom: 10,
  },
  prizeHint: {
    fontSize: 12,
    color: colors.send,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
    lineHeight: 17,
    fontWeight: '600',
  },
  countdownRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: colors.gold,
    backgroundColor: 'rgba(201, 162, 39, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  countdownValue: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.gold,
    fontVariant: ['tabular-nums'],
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: colors.creamMuted,
  },
  primaryButton: {
    backgroundColor: colors.inputField,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.cream,
  },
});

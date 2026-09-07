import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COMPETITION_PRIZE_HINT } from '../../constants/competition';
import type { RootStackParamList } from '../../navigation/types';
import {
  getCompetitionParticipationWithSync,
  type CompetitionParticipation,
} from '../../services/competitionParticipationStorage';
import { colors } from '../../theme/colors';
import {
  getCompetitionSnapshotByKind,
  getCountdownToNextEvent,
  parseCountdownParts,
  type CompetitionSnapshot,
} from '../../utils/competitionSchedule';

const DAILY_KIND = 'daily' as const;

interface CardTheme {
  accent: string;
  accentSoft: string;
  badge: string;
  icon: keyof typeof Ionicons.glyphMap;
  scheduleText: string;
}

const DAILY_THEME: CardTheme = {
  accent: colors.gold,
  accentSoft: 'rgba(201, 162, 39, 0.14)',
  badge: 'Günlük',
  icon: 'time-outline',
  scheduleText: "Her gün 20:00'de",
};


function CountdownDigit({
  value,
  label,
  accent,
}: {
  value: number;
  label: string;
  accent: string;
}) {
  return (
    <View style={styles.digitColumn}>
      <View style={styles.digitBox}>
        <Text style={[styles.digitValue, { color: accent }]}>
          {String(value).padStart(2, '0')}
        </Text>
      </View>
      <Text style={styles.digitLabel}>{label}</Text>
    </View>
  );
}

function CountdownSeparator({ accent }: { accent: string }) {
  return <Text style={[styles.digitSeparator, { color: accent }]}>:</Text>;
}

function CompetitionCountdownRow({
  countdownMs,
  label,
  accent,
}: {
  countdownMs: number;
  label: string;
  accent: string;
}) {
  const parts = parseCountdownParts(countdownMs);
  const hours = parts.hours + parts.days * 24;

  return (
    <View style={styles.countdownSection}>
      <View style={styles.countdownLabelRow}>
        <Ionicons name="time-outline" size={14} color={accent} />
        <Text style={styles.countdownLabel}>{label}</Text>
      </View>

      <View style={styles.digitsRow}>
        <CountdownDigit value={hours} label="Saat" accent={accent} />
        <CountdownSeparator accent={accent} />
        <CountdownDigit value={parts.minutes} label="Dakika" accent={accent} />
        <CountdownSeparator accent={accent} />
        <CountdownDigit value={parts.seconds} label="Saniye" accent={accent} />
      </View>
    </View>
  );
}

function CompetitionCard({
  snapshot,
  participation,
  onJoin,
  prizeHintText,
}: {
  snapshot: CompetitionSnapshot;
  participation: CompetitionParticipation | null;
  onJoin: () => void;
  prizeHintText: string;
}) {
  const theme = DAILY_THEME;
  const isOpen = snapshot.phase === 'lobby' || snapshot.phase === 'active';
  const hasCompleted = participation?.completed === true;
  const hasParticipated = participation?.participated === true;
  const canJoin = snapshot.phase === 'lobby' && !hasParticipated;
  const missedJoinWindow = snapshot.phase === 'active' && !hasParticipated && !hasCompleted;
  const nextEventCountdownMs = getCountdownToNextEvent(snapshot);

  return (
    <View style={[styles.competitionCard, { borderColor: `${theme.accent}55` }]}>
      <View style={[styles.cardAccentLine, { backgroundColor: theme.accent }]} />

      <View style={styles.cardTopRow}>
        <View style={styles.cardTitleRow}>
          <View style={[styles.cardIconWrap, { backgroundColor: theme.accentSoft }]}>
            <Ionicons name={theme.icon} size={20} color={theme.accent} />
          </View>
          <View>
            <Text style={styles.cardTitle}>{snapshot.title}</Text>
            <Text style={styles.cardSchedule}>{theme.scheduleText}</Text>
          </View>
        </View>

        <View style={[styles.typeBadge, { backgroundColor: theme.accentSoft }]}>
          <Text style={[styles.typeBadgeText, { color: theme.accent }]}>{theme.badge}</Text>
        </View>
      </View>

      {isOpen && hasCompleted ? (
        <View style={styles.completedSection}>
          <View style={styles.completedStatus}>
            <Ionicons name="checkmark-circle" size={18} color="#86EFAC" />
            <Text style={styles.completedStatusText}>Yarışmayı Tamamladın</Text>
          </View>
          {participation?.score != null ? (
            <Text style={styles.completedScore}>{participation.score} puan aldın</Text>
          ) : null}
          <CompetitionCountdownRow
            countdownMs={nextEventCountdownMs}
            label="Sonraki yarışmaya kalan süre"
            accent={theme.accent}
          />
        </View>
      ) : null}

      {isOpen && hasParticipated && !hasCompleted ? (
        <View style={styles.completedSection}>
          <View style={styles.completedStatus}>
            <Ionicons name="information-circle" size={18} color={colors.send} />
            <Text style={styles.completedStatusText}>Bu yarışmaya katıldın</Text>
          </View>
          <Text style={styles.completedHint}>Her yarışmaya yalnızca bir kez katılabilirsin</Text>
        </View>
      ) : null}

      {canJoin ? (
        <View style={styles.liveSection}>
          <View style={styles.liveStatus}>
            <View style={styles.liveDot} />
            <Text style={styles.liveStatusText}>Yarışma Başlamak Üzere!</Text>
          </View>

          <Text style={styles.joinPrizeHint}>{prizeHintText}</Text>

          <CompetitionCountdownRow
            countdownMs={snapshot.countdownMs}
            label="Yarışma başlamasına kalan süre"
            accent={theme.accent}
          />

          <Pressable
            style={[styles.joinButton, { backgroundColor: theme.accent }]}
            onPress={onJoin}
            accessibilityRole="button"
            accessibilityLabel={`${snapshot.title} katıl`}
          >
            <Text style={styles.joinButtonText}>Katıl</Text>
            <Ionicons name="arrow-forward" size={15} color={colors.cream} />
          </Pressable>
        </View>
      ) : null}

      {missedJoinWindow ? (
        <View style={styles.missedSection}>
          <View style={styles.missedStatus}>
            <Ionicons name="alert-circle-outline" size={18} color={colors.warning} />
            <Text style={styles.missedStatusText}>Maalesef Yarışma Başladı</Text>
          </View>
          <Text style={styles.missedHint}>Katılım süresini kaçırdın. Sonraki yarışmayı bekle.</Text>
        </View>
      ) : null}

      {snapshot.phase === 'upcoming' ? (
        <View style={styles.upcomingSection}>
          <Text style={styles.joinPrizeHint}>{prizeHintText}</Text>
          <CompetitionCountdownRow
            countdownMs={snapshot.countdownMs}
            label="Başlamasına kalan süre"
            accent={theme.accent}
          />
        </View>
      ) : null}
    </View>
  );
}

export default function HomeCompetitionSection() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [snapshot, setSnapshot] = useState(() => getCompetitionSnapshotByKind(DAILY_KIND));
  const [participation, setParticipation] = useState<CompetitionParticipation | null>(null);
  const refreshParticipation = useCallback(async (current: CompetitionSnapshot) => {
    const next = await getCompetitionParticipationWithSync(DAILY_KIND, current.eventId);
    setParticipation(next);
  }, []);

  useEffect(() => {
    const tick = () => {
      const nextSnapshot = getCompetitionSnapshotByKind(DAILY_KIND);
      setSnapshot(nextSnapshot);
      void refreshParticipation(nextSnapshot);
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [refreshParticipation]);

  useFocusEffect(
    useCallback(() => {
      const nextSnapshot = getCompetitionSnapshotByKind(DAILY_KIND);
      setSnapshot(nextSnapshot);
      void refreshParticipation(nextSnapshot);
    }, [refreshParticipation]),
  );

  const isOpen = snapshot.phase === 'lobby' || snapshot.phase === 'active';

  const handleJoin = () => {
    navigation.navigate('QuizLobby', { period: DAILY_KIND });
  };

  return (
    <View style={styles.card}>
      <View style={[styles.accent, { backgroundColor: colors.gold }]} />

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.trophyWrap}>
              <View style={styles.trophyGlow} />
              <View style={styles.trophyIcon}>
                <Ionicons name="trophy" size={22} color={colors.gold} />
              </View>
            </View>
            <View>
              <Text style={styles.title}>Bilgi Yarışması</Text>
              <Text style={styles.headerSubtitle}>Her gün 20:00 · Günlük yarışma</Text>
            </View>
          </View>

          {isOpen ? (
            <View style={styles.liveHeaderBadge}>
              <Ionicons name="flash" size={12} color={colors.inputField} />
              <Text style={styles.liveHeaderBadgeText}>Canlı</Text>
            </View>
          ) : null}
        </View>

        <CompetitionCard
          snapshot={snapshot}
          participation={participation}
          onJoin={handleJoin}
          prizeHintText={COMPETITION_PRIZE_HINT}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: colors.textOnLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  accent: {
    width: 5,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  trophyWrap: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trophyGlow: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(201, 162, 39, 0.14)',
  },
  trophyIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(201, 162, 39, 0.1)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(201, 162, 39, 0.3)',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textOnLight,
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textMutedOnLight,
  },
  liveHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(91, 143, 201, 0.14)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(91, 143, 201, 0.28)',
  },
  liveHeaderBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5B8FC9',
  },
  cards: {
    gap: 12,
  },
  competitionCard: {
    backgroundColor: colors.bar,
    borderRadius: 16,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  cardAccentLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 14,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  cardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.cream,
    marginBottom: 2,
  },
  cardSchedule: {
    fontSize: 12,
    color: colors.creamMuted,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  countdownSection: {
    gap: 10,
  },
  countdownLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countdownLabel: {
    fontSize: 12,
    color: colors.creamMuted,
  },
  digitsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 4,
  },
  digitColumn: {
    alignItems: 'center',
    gap: 4,
    minWidth: 52,
  },
  digitBox: {
    minWidth: 44,
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.inputField,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  digitValue: {
    fontSize: 22,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  digitLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.creamMuted,
  },
  digitSeparator: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 8,
    opacity: 0.8,
  },
  liveSection: {
    gap: 10,
  },
  liveStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
  },
  liveStatusText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#86EFAC',
  },
  upcomingSection: {
    gap: 10,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  premiumButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(201, 162, 39, 0.55)',
    backgroundColor: 'rgba(201, 162, 39, 0.12)',
  },
  premiumButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gold,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.cream,
  },
  joinPrizeHint: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.creamMuted,
    paddingLeft: 2,
    paddingRight: 2,
    lineHeight: 16,
  },
  completedSection: {
    gap: 10,
  },
  completedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  completedStatusText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#86EFAC',
  },
  completedScore: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.send,
  },
  completedHint: {
    fontSize: 12,
    color: colors.creamMuted,
  },
  missedSection: {
    gap: 10,
  },
  missedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  missedStatusText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.warning,
  },
  missedHint: {
    fontSize: 12,
    color: colors.creamMuted,
  },
});

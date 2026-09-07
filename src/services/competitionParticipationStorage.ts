import AsyncStorage from '@react-native-async-storage/async-storage';

import type { CompetitionKind } from '../utils/competitionSchedule';

import { ensureQuizPlayer } from './playerStorage';
import { fetchQuizAttemptStatus, registerQuizParticipation, submitQuizAttempt } from './quizStatsApi';

const STORAGE_KEY = '@aislam/competition-participation';

export interface CompetitionParticipation {
  eventId: string;
  participated: boolean;
  completed: boolean;
  prizeEligibleAtJoin?: boolean;
  score?: number;
  correctCount?: number;
  questionCount?: number;
  participatedAt?: string;
  completedAt?: string;
}

type ParticipationMap = Partial<Record<string, CompetitionParticipation>>;

function storageKey(kind: CompetitionKind, eventId: string): string {
  return `${kind}:${eventId}`;
}

let memoryCache: ParticipationMap | null = null;

async function loadMap(): Promise<ParticipationMap> {
  if (memoryCache) return memoryCache;

  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    memoryCache = {};
    return memoryCache;
  }

  try {
    memoryCache = JSON.parse(raw) as ParticipationMap;
  } catch {
    memoryCache = {};
  }

  return memoryCache;
}

async function saveMap(map: ParticipationMap): Promise<void> {
  memoryCache = map;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export async function getCompetitionParticipation(
  kind: CompetitionKind,
  eventId: string,
): Promise<CompetitionParticipation | null> {
  const map = await loadMap();
  return map[storageKey(kind, eventId)] ?? null;
}

export async function canJoinCompetition(
  kind: CompetitionKind,
  eventId: string,
): Promise<boolean> {
  const participation = await getCompetitionParticipation(kind, eventId);
  return !participation?.participated;
}

export async function markCompetitionParticipated(
  kind: CompetitionKind,
  eventId: string,
): Promise<CompetitionParticipation> {
  const map = await loadMap();
  const key = storageKey(kind, eventId);
  const existing = map[key];

  let prizeEligibleAtJoin = existing?.prizeEligibleAtJoin ?? false;

  try {
    const player = await ensureQuizPlayer();
    const participation = await registerQuizParticipation({
      playerId: player.playerId,
      eventId,
    });
    prizeEligibleAtJoin = participation.prizeEligibleAtJoin;
  } catch {
    // Çevrimdışı veya API hatası: ödül uygunluğu kapalı kalır.
  }

  const next: CompetitionParticipation = {
    eventId,
    participated: true,
    completed: existing?.completed ?? false,
    prizeEligibleAtJoin,
    score: existing?.score,
    correctCount: existing?.correctCount,
    questionCount: existing?.questionCount,
    participatedAt: new Date().toISOString(),
    completedAt: existing?.completedAt,
  };

  map[key] = next;
  await saveMap(map);
  return next;
}

export async function markCompetitionCompleted(
  kind: CompetitionKind,
  eventId: string,
  score: number,
  correctCount: number,
  questionCount: number,
): Promise<void> {
  const map = await loadMap();
  const key = storageKey(kind, eventId);

  map[key] = {
    eventId,
    participated: true,
    completed: true,
    prizeEligibleAtJoin: map[key]?.prizeEligibleAtJoin ?? false,
    score,
    correctCount,
    questionCount,
    participatedAt: map[key]?.participatedAt ?? new Date().toISOString(),
    completedAt: new Date().toISOString(),
  };

  await saveMap(map);
}

export async function syncPendingQuizAttempts(): Promise<void> {
  const map = await loadMap();
  const pending = Object.values(map).filter(
    (entry): entry is CompetitionParticipation =>
      entry?.completed === true &&
      entry.correctCount != null &&
      entry.questionCount != null &&
      entry.eventId != null,
  );

  if (pending.length === 0) return;

  try {
    const player = await ensureQuizPlayer();

    for (const entry of pending) {
      try {
        const status = await fetchQuizAttemptStatus(player.playerId, entry.eventId);
        if (status.completed) continue;

        await submitQuizAttempt({
          playerId: player.playerId,
          eventId: entry.eventId,
          score: entry.score ?? 0,
          correctCount: entry.correctCount!,
          questionCount: entry.questionCount!,
        });
      } catch {
        // Keep pending for next sync attempt.
      }
    }
  } catch {
    // Player/API unavailable.
  }
}

export async function loadParticipationsForSnapshots(
  entries: Array<{ kind: CompetitionKind; eventId: string }>,
): Promise<Record<string, CompetitionParticipation | null>> {
  const map = await loadMap();
  const result: Record<string, CompetitionParticipation | null> = {};

  for (const entry of entries) {
    result[storageKey(entry.kind, entry.eventId)] = map[storageKey(entry.kind, entry.eventId)] ?? null;
  }

  return result;
}

export async function getCompetitionParticipationWithSync(
  kind: CompetitionKind,
  eventId: string,
): Promise<CompetitionParticipation | null> {
  const local = await getCompetitionParticipation(kind, eventId);

  try {
    const { ensureQuizPlayer } = await import('./playerStorage');
    const { fetchQuizAttemptStatus } = await import('./quizStatsApi');
    const player = await ensureQuizPlayer();
    const status = await fetchQuizAttemptStatus(player.playerId, eventId);

    if (!status.participated && !local?.participated) {
      return local;
    }

    const merged: CompetitionParticipation = {
      eventId,
      participated: status.participated || local?.participated === true,
      completed: status.completed || local?.completed === true,
      prizeEligibleAtJoin: status.participated ? status.prizeEligibleAtJoin : local?.prizeEligibleAtJoin ?? false,
      score: status.completed ? status.score : local?.score,
      correctCount: local?.correctCount,
      questionCount: local?.questionCount,
      participatedAt: local?.participatedAt,
      completedAt: local?.completedAt,
    };

    if (status.participated || status.completed) {
      const map = await loadMap();
      const key = storageKey(kind, eventId);
      map[key] = {
        ...merged,
        participatedAt: merged.participatedAt ?? new Date().toISOString(),
        completedAt: status.completed ? new Date().toISOString() : merged.completedAt,
      };
      await saveMap(map);
    }

    return merged;
  } catch {
    return local;
  }
}

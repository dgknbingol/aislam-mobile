import type { LeaderboardPeriod } from '../components/quiz/leaderboardMockData';
import { QUIZ_QUESTION_TIME_MS, QUIZ_SESSION_SIZE } from './quizScoring';

export type CompetitionKind = LeaderboardPeriod;

export type CompetitionPhase = 'upcoming' | 'lobby' | 'active';

/** Lobby opens at event start; game begins after this delay. */
export const COMPETITION_LOBBY_MS = 2 * 60 * 1000;

/** Time allowed to play after lobby (10 × 20s + answer transitions + buffer). */
const QUIZ_ANSWER_TRANSITION_MS = 1_200;
const QUIZ_PLAY_BUFFER_MS = 30_000;
export const COMPETITION_PLAY_MS =
  QUIZ_SESSION_SIZE * QUIZ_QUESTION_TIME_MS +
  QUIZ_SESSION_SIZE * QUIZ_ANSWER_TRANSITION_MS +
  QUIZ_PLAY_BUFFER_MS;

/** Total event length: lobby + play window (20:00 → ~20:06). */
export const COMPETITION_DURATION_MS = COMPETITION_LOBBY_MS + COMPETITION_PLAY_MS;

export interface CompetitionConfig {
  kind: CompetitionKind;
  title: string;
  scheduleLabel: string;
  hour: number;
  minute: number;
  weekday?: number;
  dayOfMonth?: number;
  lastDayOfMonth?: boolean;
}

export interface CompetitionSnapshot {
  kind: CompetitionKind;
  title: string;
  scheduleLabel: string;
  phase: CompetitionPhase;
  eventId: string;
  eventStart: Date;
  gameStart: Date;
  eventEnd: Date;
  nextEventStart: Date;
  countdownMs: number;
}

/** Bildirim ve ana ekran: yalnızca günlük yarışma. */
export const COMPETITIONS: CompetitionConfig[] = [
  {
    kind: 'daily',
    title: 'Günlük Yarışma',
    scheduleLabel: 'Her gün 20:00',
    hour: 20,
    minute: 0,
  },
];

/** @deprecated Haftalık/aylık yarışma kaldırıldı; geriye dönük snapshot için tutuluyor. */
const LEGACY_WEEKLY: CompetitionConfig = {
  kind: 'weekly',
  title: 'Haftalık Yarışma',
  scheduleLabel: 'Her Pazar 20:00',
  hour: 20,
  minute: 0,
  weekday: 0,
};

/** @deprecated Haftalık/aylık yarışma kaldırıldı; geriye dönük snapshot için tutuluyor. */
const LEGACY_MONTHLY: CompetitionConfig = {
  kind: 'monthly',
  title: 'Aylık Yarışma',
  scheduleLabel: 'Her ayın son günü 20:00',
  hour: 20,
  minute: 0,
  lastDayOfMonth: true,
};

function atTime(base: Date, hour: number, minute: number): Date {
  const next = new Date(base);
  next.setHours(hour, minute, 0, 0);
  return next;
}

export function getGameStart(eventStart: Date): Date {
  return new Date(eventStart.getTime() + COMPETITION_LOBBY_MS);
}

export function getEventEnd(eventStart: Date): Date {
  return new Date(eventStart.getTime() + COMPETITION_DURATION_MS);
}

export function getCompetitionEventId(kind: CompetitionKind, eventStart: Date): string {
  const year = eventStart.getFullYear();
  const month = String(eventStart.getMonth() + 1).padStart(2, '0');
  const day = String(eventStart.getDate()).padStart(2, '0');
  return `${kind}-${year}-${month}-${day}`;
}

function buildSnapshot(
  config: CompetitionConfig,
  phase: CompetitionPhase,
  eventStart: Date,
  nextEventStart: Date,
  now: Date,
): CompetitionSnapshot {
  const gameStart = getGameStart(eventStart);
  const eventEnd = getEventEnd(eventStart);

  let countdownMs = 0;
  if (phase === 'upcoming') {
    countdownMs = eventStart.getTime() - now.getTime();
  } else if (phase === 'lobby') {
    countdownMs = gameStart.getTime() - now.getTime();
  } else {
    countdownMs = eventEnd.getTime() - now.getTime();
  }

  return {
    kind: config.kind,
    title: config.title,
    scheduleLabel: config.scheduleLabel,
    phase,
    eventId: getCompetitionEventId(config.kind, eventStart),
    eventStart,
    gameStart,
    eventEnd,
    nextEventStart,
    countdownMs: Math.max(countdownMs, 0),
  };
}

function getDailySnapshot(now: Date, config: CompetitionConfig): CompetitionSnapshot {
  const todayStart = atTime(now, config.hour, config.minute);
  const todayEnd = getEventEnd(todayStart);

  if (now.getTime() >= todayStart.getTime() && now.getTime() < todayEnd.getTime()) {
    const gameStart = getGameStart(todayStart);
    const phase: CompetitionPhase = now.getTime() < gameStart.getTime() ? 'lobby' : 'active';
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextEventStart = atTime(tomorrow, config.hour, config.minute);
    return buildSnapshot(config, phase, todayStart, nextEventStart, now);
  }

  if (now < todayStart) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextEventStart = atTime(tomorrow, config.hour, config.minute);
    return buildSnapshot(config, 'upcoming', todayStart, nextEventStart, now);
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextStart = atTime(tomorrow, config.hour, config.minute);
  const nextNext = new Date(tomorrow);
  nextNext.setDate(nextNext.getDate() + 1);
  return buildSnapshot(config, 'upcoming', nextStart, atTime(nextNext, config.hour, config.minute), now);
}

function getWeeklySnapshot(now: Date, config: CompetitionConfig): CompetitionSnapshot {
  const weekday = config.weekday ?? 0;
  const isEventDay = now.getDay() === weekday;
  const todayStart = atTime(now, config.hour, config.minute);
  const todayEnd = getEventEnd(todayStart);

  if (isEventDay && now.getTime() >= todayStart.getTime() && now.getTime() < todayEnd.getTime()) {
    const gameStart = getGameStart(todayStart);
    const phase: CompetitionPhase = now.getTime() < gameStart.getTime() ? 'lobby' : 'active';
    const nextEventStart = nextWeekday(now, weekday, config.hour, config.minute);
    return buildSnapshot(config, phase, todayStart, nextEventStart, now);
  }

  if (isEventDay && now < todayStart) {
    const nextEventStart = nextWeekday(now, weekday, config.hour, config.minute);
    return buildSnapshot(config, 'upcoming', todayStart, nextEventStart, now);
  }

  const nextStart = nextWeekday(now, weekday, config.hour, config.minute);
  const afterNext = new Date(nextStart);
  afterNext.setDate(afterNext.getDate() + 7);
  return buildSnapshot(config, 'upcoming', nextStart, atTime(afterNext, config.hour, config.minute), now);
}

function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function isLastDayOfMonth(date: Date): boolean {
  return date.getDate() === getLastDayOfMonth(date.getFullYear(), date.getMonth());
}

function getMonthlySnapshot(now: Date, config: CompetitionConfig): CompetitionSnapshot {
  const isEventDay = isLastDayOfMonth(now);
  const todayStart = atTime(now, config.hour, config.minute);
  const todayEnd = getEventEnd(todayStart);

  if (isEventDay && now.getTime() >= todayStart.getTime() && now.getTime() < todayEnd.getTime()) {
    const gameStart = getGameStart(todayStart);
    const phase: CompetitionPhase = now.getTime() < gameStart.getTime() ? 'lobby' : 'active';
    const nextEventStart = nextMonthLastDay(now, config.hour, config.minute);
    return buildSnapshot(config, phase, todayStart, nextEventStart, now);
  }

  if (isEventDay && now < todayStart) {
    const nextEventStart = nextMonthLastDay(now, config.hour, config.minute);
    return buildSnapshot(config, 'upcoming', todayStart, nextEventStart, now);
  }

  const nextStart = nextMonthLastDay(now, config.hour, config.minute);
  const probe = new Date(nextStart);
  probe.setMonth(probe.getMonth() + 1);
  const nextNext = nextMonthLastDay(probe, config.hour, config.minute);
  return buildSnapshot(config, 'upcoming', nextStart, nextNext, now);
}

function nextWeekday(from: Date, weekday: number, hour: number, minute: number): Date {
  const result = new Date(from);
  const daysUntil = (weekday - from.getDay() + 7) % 7 || 7;
  result.setDate(result.getDate() + daysUntil);
  return atTime(result, hour, minute);
}

function nextMonthLastDay(from: Date, hour: number, minute: number): Date {
  const year = from.getFullYear();
  const month = from.getMonth();
  const lastDay = getLastDayOfMonth(year, month);
  const thisMonthLast = new Date(year, month, lastDay, hour, minute, 0, 0);

  if (thisMonthLast.getTime() > from.getTime()) {
    return thisMonthLast;
  }

  const nextMonth = month + 1;
  const nextYear = nextMonth > 11 ? year + 1 : year;
  const normalizedMonth = nextMonth % 12;
  const nextLastDay = getLastDayOfMonth(nextYear, normalizedMonth);
  return new Date(nextYear, normalizedMonth, nextLastDay, hour, minute, 0, 0);
}

export function getCompetitionSnapshot(
  config: CompetitionConfig,
  now: Date = new Date(),
): CompetitionSnapshot {
  switch (config.kind) {
    case 'weekly':
      return getWeeklySnapshot(now, config);
    case 'monthly':
      return getMonthlySnapshot(now, config);
    default:
      return getDailySnapshot(now, config);
  }
}

export function getCompetitionSnapshotByKind(
  kind: CompetitionKind,
  now: Date = new Date(),
): CompetitionSnapshot {
  const config =
    COMPETITIONS.find((item) => item.kind === kind) ??
    (kind === 'weekly' ? LEGACY_WEEKLY : kind === 'monthly' ? LEGACY_MONTHLY : undefined);
  if (!config) {
    throw new Error(`Unknown competition kind: ${kind}`);
  }
  return getCompetitionSnapshot(config, now);
}

export function getUpcomingMonthlyCompetitionStarts(
  from: Date,
  count: number,
  hour: number,
  minute: number,
): Date[] {
  const results: Date[] = [];
  let year = from.getFullYear();
  let month = from.getMonth();

  while (results.length < count) {
    const lastDay = getLastDayOfMonth(year, month);
    const eventDate = new Date(year, month, lastDay, hour, minute, 0, 0);
    if (eventDate.getTime() > from.getTime()) {
      results.push(eventDate);
    }
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }

  return results;
}

export function getAllCompetitionSnapshots(now: Date = new Date()): CompetitionSnapshot[] {
  return COMPETITIONS.map((config) => getCompetitionSnapshot(config, now));
}

export function parseCountdownParts(remainingMs: number) {
  const totalSeconds = Math.max(Math.floor(remainingMs / 1000), 0);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds };
}

export function formatLiveCountdown(remainingMs: number): string {
  const totalSeconds = Math.max(Math.floor(remainingMs / 1000), 0);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function getCountdownToNextEvent(
  snapshot: CompetitionSnapshot,
  now: Date = new Date(),
): number {
  return Math.max(snapshot.nextEventStart.getTime() - now.getTime(), 0);
}

export function formatCountdown(remainingMs: number): string {
  const totalSeconds = Math.max(Math.floor(remainingMs / 1000), 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${mm}:${ss}`;
  }
  return `${minutes}:${ss}`;
}

/** @deprecated Use snapshot.phase === 'lobby' || snapshot.phase === 'active' */
export type CompetitionStatus = CompetitionPhase;

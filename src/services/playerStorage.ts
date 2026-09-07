const PLAYER_ID_KEY = '@aislam/quiz-player-id';
const PLAYER_NAME_KEY = '@aislam/quiz-player-name';

const DEFAULT_DISPLAY_NAME = 'Oyuncu';

let cachedPlayer: { playerId: string; displayName: string } | null = null;

async function readStoredPlayer(): Promise<{ playerId: string | null; displayName: string }> {
  const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
  const [playerId, displayName] = await Promise.all([
    AsyncStorage.getItem(PLAYER_ID_KEY),
    AsyncStorage.getItem(PLAYER_NAME_KEY),
  ]);

  return {
    playerId,
    displayName: displayName ?? DEFAULT_DISPLAY_NAME,
  };
}

async function persistPlayer(playerId: string, displayName: string): Promise<void> {
  const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
  await Promise.all([
    AsyncStorage.setItem(PLAYER_ID_KEY, playerId),
    AsyncStorage.setItem(PLAYER_NAME_KEY, displayName),
  ]);
  cachedPlayer = { playerId, displayName };
}

export async function ensureQuizPlayer(displayName = DEFAULT_DISPLAY_NAME): Promise<{
  playerId: string;
  displayName: string;
}> {
  const { getStoredAuthUser } = await import('./authStorage');
  const authUser = await getStoredAuthUser();

  if (authUser) {
    // Oturum açmış kullanıcı: Quiz kimliği hesabın kendisidir.
    if (cachedPlayer?.playerId === authUser.id) {
      return cachedPlayer;
    }

    const { registerQuizPlayer } = await import('./quizStatsApi');
    const response = await registerQuizPlayer({
      playerId: authUser.id,
      displayName: authUser.displayName || displayName,
    });

    cachedPlayer = { playerId: response.playerId, displayName: response.displayName };
    // displayName'i sanitize eden backend değerini cihazda da tut.
    await persistPlayer(response.playerId, response.displayName);
    return response;
  }

  if (cachedPlayer) return cachedPlayer;

  const { registerQuizPlayer } = await import('./quizStatsApi');
  const stored = await readStoredPlayer();
  const response = await registerQuizPlayer({
    playerId: stored.playerId,
    displayName: stored.displayName || displayName,
  });

  await persistPlayer(response.playerId, response.displayName);
  return response;
}

export async function getCachedQuizPlayer(): Promise<{ playerId: string; displayName: string } | null> {
  if (cachedPlayer) return cachedPlayer;
  const stored = await readStoredPlayer();
  if (!stored.playerId) return null;
  cachedPlayer = { playerId: stored.playerId, displayName: stored.displayName };
  return cachedPlayer;
}

export function getCurrentPlayerId(): string | null {
  return cachedPlayer?.playerId ?? null;
}

export async function clearCachedQuizPlayer(): Promise<void> {
  cachedPlayer = null;
  const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
  await Promise.all([AsyncStorage.removeItem(PLAYER_ID_KEY), AsyncStorage.removeItem(PLAYER_NAME_KEY)]);
}

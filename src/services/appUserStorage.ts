const APP_USER_ID_KEY = '@aislam/app-user-id';

let cachedAppUserId: string | null = null;

function generateUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export async function ensureAppUserId(): Promise<string> {
  if (cachedAppUserId) return cachedAppUserId;

  const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
  const stored = await AsyncStorage.getItem(APP_USER_ID_KEY);
  if (stored) {
    cachedAppUserId = stored;
    return stored;
  }

  const nextId = generateUuid();
  await AsyncStorage.setItem(APP_USER_ID_KEY, nextId);
  cachedAppUserId = nextId;
  return nextId;
}

export function getCachedAppUserId(): string | null {
  return cachedAppUserId;
}

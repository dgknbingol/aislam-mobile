import AsyncStorage from '@react-native-async-storage/async-storage';

export type StoredAuthUser = {
  id: string;
  email: string;
  displayName: string;
};

const AUTH_TOKEN_KEY = '@aislam/auth/token';
const AUTH_USER_KEY = '@aislam/auth/user';

export async function getStoredAuthToken(): Promise<string | null> {
  return AsyncStorage.getItem(AUTH_TOKEN_KEY);
}

export async function getStoredAuthUser(): Promise<StoredAuthUser | null> {
  const raw = await AsyncStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as StoredAuthUser;
  } catch {
    return null;
  }
}

export async function saveAuth(token: string, user: StoredAuthUser): Promise<void> {
  await AsyncStorage.multiSet([
    [AUTH_TOKEN_KEY, token],
    [AUTH_USER_KEY, JSON.stringify(user)],
  ]);
}

export async function clearAuth(): Promise<void> {
  await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, AUTH_USER_KEY]);
}


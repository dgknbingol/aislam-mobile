import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { UserProfile } from '../services/authApi';
import { login, register, updateDisplayName as requestDisplayNameUpdate } from '../services/authApi';
import { clearAuth, getStoredAuthToken, getStoredAuthUser, saveAuth, type StoredAuthUser } from '../services/authStorage';

import { clearCachedQuizPlayer } from '../services/playerStorage';

type AuthContextValue = {
  token: string | null;
  user: StoredAuthUser | null;
  isLoading: boolean;
  signIn: (params: { email: string; password: string }) => Promise<void>;
  signUp: (params: { email: string; password: string; displayName: string }) => Promise<void>;
  signOut: () => Promise<void>;
  updateDisplayName: (displayName: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function toStoredUser(u: UserProfile): StoredAuthUser {
  return {
    id: u.id,
    email: u.email,
    displayName: u.displayName,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<StoredAuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const storedToken = await getStoredAuthToken();
      const storedUser = await getStoredAuthUser();

      if (cancelled) return;
      setToken(storedToken);
      setUser(storedUser);
      setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (params: { email: string; password: string }) => {
    const result = await login(params);
    const storedUser = toStoredUser(result.user);
    setToken(result.token);
    setUser(storedUser);
    await saveAuth(result.token, storedUser);
  }, []);

  const signUp = useCallback(async (params: { email: string; password: string; displayName: string }) => {
    const result = await register(params);
    const storedUser = toStoredUser(result.user);
    setToken(result.token);
    setUser(storedUser);
    await saveAuth(result.token, storedUser);
  }, []);

  const signOut = useCallback(async () => {
    await clearAuth();
    setToken(null);
    setUser(null);
    void clearCachedQuizPlayer().catch(() => {});
  }, []);

  const updateDisplayName = useCallback(
    async (displayName: string) => {
      if (!token) throw new Error('Kullanıcı oturumu yok.');
      const updated = await requestDisplayNameUpdate(token, displayName);
      const storedUser = toStoredUser(updated);
      setUser(storedUser);
      await saveAuth(token, storedUser);
    },
    [token],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isLoading,
      signIn,
      signUp,
      signOut,
      updateDisplayName,
    }),
    [token, user, isLoading, signIn, signUp, signOut, updateDisplayName],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}


import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { ChatQuota } from '../services/chatApi';
import { fetchChatQuota } from '../services/chatApi';
import {
  configureRevenueCat,
  getOfferings,
  isRevenueCatConfigured,
  purchasePackage,
  restorePurchases,
  type StorePackage,
} from '../services/revenueCat';

interface SubscriptionContextValue {
  quota: ChatQuota | null;
  isLoadingQuota: boolean;
  monthlyPackage: StorePackage | null;
  yearlyPackage: StorePackage | null;
  isPurchasing: boolean;
  isStoreConfigured: boolean;
  refreshQuota: () => Promise<ChatQuota | null>;
  purchaseMonthly: () => Promise<void>;
  purchaseYearly: () => Promise<void>;
  restore: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [quota, setQuota] = useState<ChatQuota | null>(null);
  const [isLoadingQuota, setIsLoadingQuota] = useState(true);
  const [monthlyPackage, setMonthlyPackage] = useState<StorePackage | null>(null);
  const [yearlyPackage, setYearlyPackage] = useState<StorePackage | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const isStoreConfigured = isRevenueCatConfigured();

  const refreshQuota = useCallback(async (): Promise<ChatQuota | null> => {
    try {
      const next = await fetchChatQuota();
      setQuota(next);
      return next;
    } catch {
      return null;
    } finally {
      setIsLoadingQuota(false);
    }
  }, []);

  const loadOfferings = useCallback(async () => {
    if (!isStoreConfigured) return;

    try {
      await configureRevenueCat();
      const offerings = await getOfferings();
      const current = offerings?.current;
      if (!current) return;

      setMonthlyPackage(current.monthly ?? current.availablePackages[0] ?? null);
      setYearlyPackage(current.annual ?? current.availablePackages[1] ?? null);
    } catch {
      // Store not ready (Expo Go, missing products, etc.)
    }
  }, [isStoreConfigured]);

  useEffect(() => {
    void refreshQuota();
    void loadOfferings();
  }, [loadOfferings, refreshQuota]);

  const finalizePurchase = useCallback(async () => {
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const next = await refreshQuota();
      if (next?.premium) return;
      if (attempt < 5) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }
    }
  }, [refreshQuota]);

  const purchaseMonthly = useCallback(async () => {
    if (!monthlyPackage) {
      throw new Error('Aylık paket henüz yapılandırılmadı.');
    }
    setIsPurchasing(true);
    try {
      await purchasePackage(monthlyPackage);
      await finalizePurchase();
    } finally {
      setIsPurchasing(false);
    }
  }, [finalizePurchase, monthlyPackage]);

  const purchaseYearly = useCallback(async () => {
    if (!yearlyPackage) {
      throw new Error('Yıllık paket henüz yapılandırılmadı.');
    }
    setIsPurchasing(true);
    try {
      await purchasePackage(yearlyPackage);
      await finalizePurchase();
    } finally {
      setIsPurchasing(false);
    }
  }, [finalizePurchase, yearlyPackage]);

  const restore = useCallback(async () => {
    setIsPurchasing(true);
    try {
      await restorePurchases();
      await finalizePurchase();
    } finally {
      setIsPurchasing(false);
    }
  }, [finalizePurchase]);

  const value = useMemo<SubscriptionContextValue>(
    () => ({
      quota,
      isLoadingQuota,
      monthlyPackage,
      yearlyPackage,
      isPurchasing,
      isStoreConfigured,
      refreshQuota,
      purchaseMonthly,
      purchaseYearly,
      restore,
    }),
    [
      quota,
      isLoadingQuota,
      monthlyPackage,
      yearlyPackage,
      isPurchasing,
      isStoreConfigured,
      refreshQuota,
      purchaseMonthly,
      purchaseYearly,
      restore,
    ],
  );

  return (
    <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return context;
}

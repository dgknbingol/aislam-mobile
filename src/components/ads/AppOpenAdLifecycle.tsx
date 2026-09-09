import { useCallback, useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { useSubscription } from '../../context/SubscriptionContext';
import { preloadFullscreenAds, showAppOpenIfEligible } from '../../services/fullscreenAds';

interface AppOpenAdLifecycleProps {
  /** true iken App Open gösterme (splash / ilk yükleme). */
  splashVisible: boolean;
}

/**
 * Splash bittikten sonra bir kez App Open dener;
 * uzun süre arka plandan dönüşte de (cooldown serviste) dener.
 */
export default function AppOpenAdLifecycle({ splashVisible }: AppOpenAdLifecycleProps) {
  const { quota } = useSubscription();
  const isPremium = quota?.premium === true;
  const coldStartShownRef = useRef(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const backgroundedAtRef = useRef<number | null>(null);

  useEffect(() => {
    preloadFullscreenAds();
  }, []);

  const tryShow = useCallback(() => {
    if (splashVisible || isPremium) return;
    void showAppOpenIfEligible({ isPremium });
  }, [isPremium, splashVisible]);

  useEffect(() => {
    if (splashVisible || isPremium || coldStartShownRef.current) return;

    coldStartShownRef.current = true;
    const timer = setTimeout(() => {
      tryShow();
    }, 400);

    return () => clearTimeout(timer);
  }, [isPremium, splashVisible, tryShow]);

  useEffect(() => {
    const onChange = (next: AppStateStatus) => {
      const prev = appStateRef.current;
      appStateRef.current = next;

      if (next === 'background' || next === 'inactive') {
        backgroundedAtRef.current = Date.now();
        return;
      }

      if (next === 'active' && (prev === 'background' || prev === 'inactive')) {
        const awayMs = backgroundedAtRef.current
          ? Date.now() - backgroundedAtRef.current
          : 0;
        backgroundedAtRef.current = null;
        // Kısa task switch'lerde gösterme (en az ~1 dk arka plan).
        if (awayMs < 60_000 || splashVisible || isPremium) return;
        tryShow();
      }
    };

    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [isPremium, splashVisible, tryShow]);

  return null;
}

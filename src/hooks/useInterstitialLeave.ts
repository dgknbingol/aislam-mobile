import { useCallback } from 'react';

import { useSubscription } from '../context/SubscriptionContext';
import { showInterstitialIfEligible } from '../services/fullscreenAds';

/**
 * Doğal ekran çıkışında interstitial dener, sonra given aksiyonu çalıştırır.
 * Cooldown / premium / yüklenmemiş reklam sessizce atlanır.
 */
export function useInterstitialLeave() {
  const { quota } = useSubscription();
  const isPremium = quota?.premium === true;

  return useCallback(
    async (after?: () => void) => {
      await showInterstitialIfEligible({ isPremium });
      after?.();
    },
    [isPremium],
  );
}

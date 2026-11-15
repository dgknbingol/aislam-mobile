import { getRewardedAdUnitId, isNativeAdsAvailable } from '../constants/ads';
import { ensureAppUserId } from './appUserStorage';

type RewardedAdLike = {
  loaded: boolean;
  load: () => void;
  show: () => Promise<void>;
  addAdEventListener: (type: string, listener: (...args: unknown[]) => void) => () => void;
};

let rewarded: RewardedAdLike | null = null;
let rewardedLoading = false;
let adsModule: typeof import('react-native-google-mobile-ads') | null = null;

function getAdsModule(): typeof import('react-native-google-mobile-ads') | null {
  if (!isNativeAdsAvailable()) {
    return null;
  }
  if (adsModule) {
    return adsModule;
  }
  try {
    adsModule = require('react-native-google-mobile-ads') as typeof import('react-native-google-mobile-ads');
    return adsModule;
  } catch {
    return null;
  }
}

async function requestOptions() {
  const userId = await ensureAppUserId();
  return {
    requestNonPersonalizedAdsOnly: true as const,
    serverSideVerificationOptions: {
      userId,
      customData: `eislam-${Date.now()}`,
    },
  };
}

export function preloadRewardedAd(): void {
  if (!isNativeAdsAvailable()) return;
  void loadRewarded();
}

async function loadRewarded(): Promise<void> {
  const mod = getAdsModule();
  if (!mod || rewardedLoading) return;
  if (rewarded?.loaded) return;

  rewardedLoading = true;
  try {
    const options = await requestOptions();
    const next = mod.RewardedAd.createForAdRequest(
      getRewardedAdUnitId(),
      options,
    ) as unknown as RewardedAdLike;
    rewarded = next;

    next.addAdEventListener(mod.RewardedAdEventType.LOADED, () => {
      rewardedLoading = false;
    });
    next.addAdEventListener(mod.AdEventType.ERROR, () => {
      rewardedLoading = false;
      rewarded = null;
    });
    next.load();
  } catch {
    rewardedLoading = false;
    rewarded = null;
  }
}

export type RewardedShowResult =
  | { status: 'earned' }
  | { status: 'dismissed' }
  | { status: 'unavailable' }
  | { status: 'error'; message: string };

/**
 * Rewarded gösterir. Ödül EARNED_REWARD ile onaylanır;
 * bonus AdMob SSV callback ile sunucuda verilir — istemci claim etmez.
 */
export function showRewardedAd(): Promise<RewardedShowResult> {
  return new Promise((resolve) => {
    if (!isNativeAdsAvailable()) {
      resolve({ status: 'unavailable' });
      return;
    }

    const mod = getAdsModule();
    if (!mod) {
      resolve({ status: 'unavailable' });
      return;
    }

    if (!rewarded?.loaded) {
      void loadRewarded();
      resolve({ status: 'unavailable' });
      return;
    }

    const ad = rewarded;
    let earned = false;
    let settled = false;
    let closedFallbackTimer: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (closedFallbackTimer) {
        clearTimeout(closedFallbackTimer);
        closedFallbackTimer = null;
      }
      unsubEarned();
      unsubClosed();
      unsubError();
      rewarded = null;
      rewardedLoading = false;
      void loadRewarded();
    };

    const finish = (result: RewardedShowResult) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(result);
    };

    const unsubEarned = ad.addAdEventListener(mod.RewardedAdEventType.EARNED_REWARD, () => {
      earned = true;
      finish({ status: 'earned' });
    });
    const unsubClosed = ad.addAdEventListener(mod.AdEventType.CLOSED, () => {
      closedFallbackTimer = setTimeout(() => {
        finish(earned ? { status: 'earned' } : { status: 'dismissed' });
      }, 400);
    });
    const unsubError = ad.addAdEventListener(mod.AdEventType.ERROR, () => {
      finish({ status: 'error', message: 'Reklam gösterilemedi.' });
    });

    void ad.show().catch(() => {
      finish({ status: 'error', message: 'Reklam gösterilemedi.' });
    });
  });
}

export function isRewardedAdReady(): boolean {
  return rewarded?.loaded === true;
}

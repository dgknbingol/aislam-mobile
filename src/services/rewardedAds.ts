import { getRewardedAdUnitId, isNativeAdsAvailable } from '../constants/ads';

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

function requestOptions() {
  return { requestNonPersonalizedAdsOnly: true as const };
}

export function preloadRewardedAd(): void {
  if (!isNativeAdsAvailable()) return;
  loadRewarded();
}

function loadRewarded(): void {
  const mod = getAdsModule();
  if (!mod || rewardedLoading) return;

  rewardedLoading = true;
  try {
    const next = mod.RewardedAd.createForAdRequest(
      getRewardedAdUnitId(),
      requestOptions(),
    ) as unknown as RewardedAdLike;
    rewarded = next;

    next.addAdEventListener(mod.RewardedAdEventType.LOADED, () => {
      rewardedLoading = false;
    });
    next.addAdEventListener(mod.AdEventType.ERROR, () => {
      rewardedLoading = false;
      rewarded = null;
    });
    next.addAdEventListener(mod.AdEventType.CLOSED, () => {
      rewarded = null;
      rewardedLoading = false;
      loadRewarded();
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
 * Rewarded gösterir. Ödül yalnızca EARNED_REWARD olayında `earned` döner.
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
      loadRewarded();
      resolve({ status: 'unavailable' });
      return;
    }

    const ad = rewarded;
    let earned = false;
    let settled = false;

    const finish = (result: RewardedShowResult) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    const unsubEarned = ad.addAdEventListener(mod.RewardedAdEventType.EARNED_REWARD, () => {
      earned = true;
    });
    const unsubClosed = ad.addAdEventListener(mod.AdEventType.CLOSED, () => {
      unsubEarned();
      unsubClosed();
      unsubError();
      rewarded = null;
      loadRewarded();
      finish(earned ? { status: 'earned' } : { status: 'dismissed' });
    });
    const unsubError = ad.addAdEventListener(mod.AdEventType.ERROR, () => {
      unsubEarned();
      unsubClosed();
      unsubError();
      rewarded = null;
      loadRewarded();
      finish({ status: 'error', message: 'Reklam gösterilemedi.' });
    });

    void ad.show().catch(() => {
      unsubEarned();
      unsubClosed();
      unsubError();
      rewarded = null;
      loadRewarded();
      finish({ status: 'error', message: 'Reklam gösterilemedi.' });
    });
  });
}

export function isRewardedAdReady(): boolean {
  return rewarded?.loaded === true;
}

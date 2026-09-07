import { useSubscription } from '../../context/SubscriptionContext';
import { isNativeAdsAvailable } from '../../constants/ads';

/** Ücretsiz kullanıcılar için alt banner — premium'da ve Expo Go'da gizlenir. */
export default function AdBanner() {
  const { quota } = useSubscription();

  if (quota?.premium || !isNativeAdsAvailable()) {
    return null;
  }

  const AdBannerNative = require('./AdBannerNative').default;
  return <AdBannerNative />;
}

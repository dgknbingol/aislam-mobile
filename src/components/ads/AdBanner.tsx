import { useSubscription } from '../../context/SubscriptionContext';
import { isNativeAdsAvailable } from '../../constants/ads';

interface AdBannerProps {
  /** Scroll içi yerleştirme (ana sayfa kartları arası). */
  inline?: boolean;
}

/** Ücretsiz kullanıcılar için banner — premium'da ve Expo Go'da gizlenir. */
export default function AdBanner({ inline = false }: AdBannerProps) {
  const { quota } = useSubscription();

  if (quota?.premium || !isNativeAdsAvailable()) {
    return null;
  }

  const AdBannerNative = require('./AdBannerNative').default;
  return <AdBannerNative inline={inline} />;
}

import { useAdsConfig } from '../../context/AdsConfigContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { isNativeAdsAvailable } from '../../constants/ads';

interface AdBannerProps {
  /** Scroll içi yerleştirme (ana sayfa kartları arası). */
  inline?: boolean;
}

/** Ücretsiz kullanıcılar için banner — premium'da, remote off ve Expo Go'da gizlenir. */
export default function AdBanner({ inline = false }: AdBannerProps) {
  const { quota } = useSubscription();
  const adsConfig = useAdsConfig();

  if (quota?.premium || !isNativeAdsAvailable() || !adsConfig.bannerEnabled) {
    return null;
  }

  const AdBannerNative = require('./AdBannerNative').default;
  return <AdBannerNative inline={inline} />;
}

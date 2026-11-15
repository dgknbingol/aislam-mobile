import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';

import {
  DEFAULT_ADS_CONFIG,
  getAdsConfig,
  hydrateAdsConfig,
  refreshAdsConfig,
  type AdsConfig,
} from '../services/adsConfig';

interface AdsConfigContextValue {
  config: AdsConfig;
  refresh: (force?: boolean) => Promise<void>;
}

const AdsConfigContext = createContext<AdsConfigContextValue>({
  config: DEFAULT_ADS_CONFIG,
  refresh: async () => undefined,
});

export function AdsConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AdsConfig>(DEFAULT_ADS_CONFIG);

  const refresh = useCallback(async (force = false) => {
    const next = await refreshAdsConfig({ force });
    setConfig({ ...next });
  }, []);

  useEffect(() => {
    void (async () => {
      await hydrateAdsConfig();
      setConfig({ ...getAdsConfig() });
      await refresh(true);
    })();
  }, [refresh]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refresh(false);
      }
    });
    return () => sub.remove();
  }, [refresh]);

  const value = useMemo(() => ({ config, refresh }), [config, refresh]);

  return <AdsConfigContext.Provider value={value}>{children}</AdsConfigContext.Provider>;
}

export function useAdsConfig(): AdsConfig {
  return useContext(AdsConfigContext).config;
}

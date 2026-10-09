import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { useKeepAwake } from 'expo-keep-awake';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import SplashOverlay, { preloadSplashImage } from './src/components/SplashOverlay';
import { preloadPrayerBannerImages } from './src/components/prayer-banners/prayerBannerAssets';
import AppOpenAdLifecycle from './src/components/ads/AppOpenAdLifecycle';
import GlobalAdBannerHost from './src/components/ads/GlobalAdBannerHost';
import { AuthProvider } from './src/context/AuthContext';
import { ChatProvider } from './src/context/ChatContext';
import { LocationProvider } from './src/context/LocationContext';
import { SubscriptionProvider } from './src/context/SubscriptionContext';
import RootNavigator from './src/navigation/RootNavigator';
import { flushPendingNotificationNavigation, navigationRef } from './src/navigation/rootNavigation';
import { initAdMob } from './src/services/adMob';
import { preloadFullscreenAds } from './src/services/fullscreenAds';
import { initPrayerNotifications } from './src/services/prayerNotificationScheduler';
import { APP_MAX_FONT_MULTIPLIER } from './src/theme/fontScale';

const SPLASH_MIN_MS = 2500;

SplashScreen.preventAutoHideAsync().catch(() => {});

/** Sistem font büyütmesinde layout patlamasını sınırla (erişilebilirlik tavanı). */
const textDefaults = (Text as unknown as { defaultProps?: Record<string, unknown> }).defaultProps ?? {};
(Text as unknown as { defaultProps: Record<string, unknown> }).defaultProps = {
  ...textDefaults,
  maxFontSizeMultiplier: APP_MAX_FONT_MULTIPLIER,
};
const inputDefaults =
  (TextInput as unknown as { defaultProps?: Record<string, unknown> }).defaultProps ?? {};
(TextInput as unknown as { defaultProps: Record<string, unknown> }).defaultProps = {
  ...inputDefaults,
  maxFontSizeMultiplier: APP_MAX_FONT_MULTIPLIER,
};

export default function App() {
  /** Uygulama açıkken sistem ekran zaman aşımını engelle (karanlık / kilit olmasın). */
  useKeepAwake();
  useFonts({
    AmiriBold: require('./assets/fonts/AmiriBold.ttf'),
  });
  const [showSplash, setShowSplash] = useState(true);
  const splashReadyRef = useRef(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    initPrayerNotifications();
    void initAdMob().then(() => {
      preloadFullscreenAds();
    });
    void preloadSplashImage().catch(() => {});
    void preloadPrayerBannerImages().catch(() => {});
  }, []);

  const scheduleSplashHide = useCallback(() => {
    if (splashReadyRef.current) return;
    splashReadyRef.current = true;

    void SplashScreen.hideAsync();
    hideTimerRef.current = setTimeout(() => {
      setShowSplash(false);
    }, SPLASH_MIN_MS);
  }, []);

  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      scheduleSplashHide();
    }, 4000);

    return () => {
      clearTimeout(fallbackTimer);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [scheduleSplashHide]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <LocationProvider>
          <AuthProvider>
            <SubscriptionProvider>
              <ChatProvider>
                <View style={styles.shell}>
                  <View style={styles.navArea}>
                    <NavigationContainer
                      ref={navigationRef}
                      onReady={() => {
                        flushPendingNotificationNavigation();
                      }}
                    >
                      <RootNavigator />
                    </NavigationContainer>
                  </View>
                  {!showSplash ? <GlobalAdBannerHost /> : null}
                </View>
                <StatusBar style="light" />
                <AppOpenAdLifecycle splashVisible={showSplash} />
              </ChatProvider>
            </SubscriptionProvider>
          </AuthProvider>
        </LocationProvider>
      </SafeAreaProvider>

      {showSplash ? <SplashOverlay onReady={scheduleSplashHide} /> : null}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  shell: {
    flex: 1,
  },
  navArea: {
    flex: 1,
  },
});

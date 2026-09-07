import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import SplashOverlay, { preloadSplashImage } from './src/components/SplashOverlay';
import { preloadPrayerBannerImages } from './src/components/prayer-banners/prayerBannerAssets';
import { ChatProvider } from './src/context/ChatContext';
import { AuthProvider } from './src/context/AuthContext';
import { LocationProvider } from './src/context/LocationContext';
import { SubscriptionProvider } from './src/context/SubscriptionContext';
import RootNavigator from './src/navigation/RootNavigator';
import { navigationRef, flushPendingNotificationNavigation } from './src/navigation/rootNavigation';
import { initPrayerNotifications } from './src/services/prayerNotificationScheduler';
import { initAdMob } from './src/services/adMob';

const SPLASH_MIN_MS = 2500;

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  useFonts({
    AmiriBold: require('./assets/fonts/AmiriBold.ttf'),
  });
  const [showSplash, setShowSplash] = useState(true);
  const splashReadyRef = useRef(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    initPrayerNotifications();
    void initAdMob();
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
                <NavigationContainer
                  ref={navigationRef}
                  onReady={() => {
                    flushPendingNotificationNavigation();
                  }}
                >
                  <RootNavigator />
                </NavigationContainer>
                <StatusBar style="light" />
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
});

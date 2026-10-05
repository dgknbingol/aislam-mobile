import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ChatDrawerNavigator from './ChatDrawerNavigator';
import HomeDrawerNavigator from './HomeDrawerNavigator';
import SettingsStackNavigator from './SettingsStackNavigator';
import EducationStackNavigator from './EducationStackNavigator';
import type { RootStackParamList } from './types';
import PrayerTimesScreen from '../screens/PrayerTimesScreen';
import NearbyMosquesScreen from '../screens/NearbyMosquesScreen';
import ReligiousDaysScreen from '../screens/ReligiousDaysScreen';
import HutbeListScreen from '../screens/HutbeListScreen';
import HutbeDetailScreen from '../screens/HutbeDetailScreen';
import KazaPrayersScreen from '../screens/KazaPrayersScreen';
import QuizLobbyScreen from '../screens/QuizLobbyScreen';
import QuizPlayScreen from '../screens/QuizPlayScreen';
import QuizScreen from '../screens/QuizScreen';
import QiblaScreen from '../screens/QiblaScreen';
import QuranScreen from '../screens/QuranScreen';
import TesbihScreen from '../screens/TesbihScreen';
import AsmaUlHusnaScreen from '../screens/AsmaUlHusnaScreen';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import { isOnboardingComplete } from '../services/onboardingStorage';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const [ready, setReady] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void isOnboardingComplete().then((done) => {
      if (cancelled) return;
      setNeedsOnboarding(!done);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={needsOnboarding ? 'Onboarding' : 'Home'}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="Onboarding"
        component={OnboardingScreen}
        options={{ gestureEnabled: false, animation: 'fade' }}
      />
      <Stack.Screen name="Home" component={HomeDrawerNavigator} />
      <Stack.Screen name="Chat" component={ChatDrawerNavigator} />
      <Stack.Screen name="Tesbih" component={TesbihScreen} />
      <Stack.Screen name="PrayerTimes" component={PrayerTimesScreen} />
      <Stack.Screen name="NearbyMosques" component={NearbyMosquesScreen} />
      <Stack.Screen name="ReligiousDays" component={ReligiousDaysScreen} />
      <Stack.Screen name="Hutbeler" component={HutbeListScreen} />
      <Stack.Screen name="HutbeDetail" component={HutbeDetailScreen} />
      <Stack.Screen name="KazaPrayers" component={KazaPrayersScreen} />
      <Stack.Screen name="Education" component={EducationStackNavigator} />
      <Stack.Screen name="Quiz" component={QuizScreen} />
      <Stack.Screen name="QuizLobby" component={QuizLobbyScreen} />
      <Stack.Screen name="QuizPlay" component={QuizPlayScreen} />
      <Stack.Screen name="Quran" component={QuranScreen} />
      <Stack.Screen name="Qibla" component={QiblaScreen} />
      <Stack.Screen name="AsmaUlHusna" component={AsmaUlHusnaScreen} />
      <Stack.Screen name="Settings" component={SettingsStackNavigator} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});

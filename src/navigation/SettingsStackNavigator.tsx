import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LocationSettingsScreen from '../screens/settings/LocationSettingsScreen';
import CompetitionNotificationSettingsScreen from '../screens/settings/CompetitionNotificationSettingsScreen';
import DailyContentNotificationSettingsScreen from '../screens/settings/DailyContentNotificationSettingsScreen';
import NotificationSettingsScreen from '../screens/settings/NotificationSettingsScreen';
import PrayerNotificationSettingsScreen from '../screens/settings/PrayerNotificationSettingsScreen';
import PremiumSettingsScreen from '../screens/settings/PremiumSettingsScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import AccountMainScreen from '../screens/account/AccountMainScreen';
import AccountSignInScreen from '../screens/account/AccountSignInScreen';
import AccountSignUpScreen from '../screens/account/AccountSignUpScreen';
import AccountEditUsernameScreen from '../screens/account/AccountEditUsernameScreen';
import type { SettingsStackParamList } from './types';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export default function SettingsStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="SettingsMain" component={SettingsScreen} />
      <Stack.Screen name="AccountMain" component={AccountMainScreen} />
      <Stack.Screen name="AccountSignIn" component={AccountSignInScreen} />
      <Stack.Screen name="AccountSignUp" component={AccountSignUpScreen} />
      <Stack.Screen name="AccountEditUsername" component={AccountEditUsernameScreen} />
      <Stack.Screen name="LocationSettings" component={LocationSettingsScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <Stack.Screen
        name="PrayerNotificationSettings"
        component={PrayerNotificationSettingsScreen}
      />
      <Stack.Screen
        name="CompetitionNotificationSettings"
        component={CompetitionNotificationSettingsScreen}
      />
      <Stack.Screen
        name="DailyContentNotificationSettings"
        component={DailyContentNotificationSettingsScreen}
      />
      <Stack.Screen name="PremiumSettings" component={PremiumSettingsScreen} />
    </Stack.Navigator>
  );
}

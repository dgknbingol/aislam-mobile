import { Platform } from 'react-native';

export function googleAuthConfig() {
  return {
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '',
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '',
  };
}

export function isGoogleAuthConfigured(): boolean {
  const config = googleAuthConfig();
  if (Platform.OS === 'ios') {
    return config.iosClientId.length > 0 || config.webClientId.length > 0;
  }
  return config.androidClientId.length > 0 || config.webClientId.length > 0;
}

export function isAppleAuthAvailable(): boolean {
  return Platform.OS === 'ios';
}

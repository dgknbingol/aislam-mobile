import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@aislam/onboarding-complete';

export async function isOnboardingComplete(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw === '1';
  } catch {
    return false;
  }
}

export async function markOnboardingComplete(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, '1');
}

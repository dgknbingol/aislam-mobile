import { Linking } from 'react-native';

export async function openLegalUrl(url: string): Promise<void> {
  const canOpen = await Linking.canOpenURL(url);
  if (!canOpen) {
    throw new Error('Bağlantı açılamadı.');
  }
  await Linking.openURL(url);
}

import { Alert, Linking, Platform } from 'react-native';

export function openDirectionsTo(latitude: number, longitude: number, name: string): void {
  const label = encodeURIComponent(name);
  const appleMapsUrl = `http://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d`;
  const googleMapsWebUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_id=${label}`;
  const googleMapsNativeUrl = `comgooglemaps://?daddr=${latitude},${longitude}&directionsmode=driving`;
  const androidGeoUrl = `geo:0,0?q=${latitude},${longitude}(${label})`;

  const openUrl = async (url: string, fallback?: string) => {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return;
    }
    if (fallback) {
      await Linking.openURL(fallback);
    }
  };

  if (Platform.OS === 'ios') {
    Alert.alert('Yol tarifi', `${name} için harita uygulamasını seçin`, [
      {
        text: 'Apple Haritalar',
        onPress: () => {
          void openUrl(appleMapsUrl);
        },
      },
      {
        text: 'Google Maps',
        onPress: () => {
          void openUrl(googleMapsNativeUrl, googleMapsWebUrl);
        },
      },
      { text: 'İptal', style: 'cancel' },
    ]);
    return;
  }

  Alert.alert('Yol tarifi', `${name} için harita uygulamasını seçin`, [
    {
      text: 'Google Maps',
      onPress: () => {
        void openUrl(androidGeoUrl, googleMapsWebUrl);
      },
    },
    {
      text: 'Tarayıcıda aç',
      onPress: () => {
        void Linking.openURL(googleMapsWebUrl);
      },
    },
    { text: 'İptal', style: 'cancel' },
  ]);
}

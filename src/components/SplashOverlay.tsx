import { Asset } from 'expo-asset';
import { Image, StyleSheet, View } from 'react-native';

const splashImage = require('../../assets/splash-screen.png');

interface SplashOverlayProps {
  onReady?: () => void;
}

export default function SplashOverlay({ onReady }: SplashOverlayProps) {
  return (
    <View style={styles.overlay} pointerEvents="auto">
      <Image
        source={splashImage}
        style={styles.image}
        resizeMode="cover"
        onLoadEnd={() => onReady?.()}
        onError={() => onReady?.()}
        accessibilityLabel="e-İslam"
      />
    </View>
  );
}

export async function preloadSplashImage() {
  await Asset.fromModule(splashImage).downloadAsync();
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
    backgroundColor: '#021734',
  },
  image: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

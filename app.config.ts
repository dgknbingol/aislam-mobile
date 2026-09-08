import type { ExpoConfig } from 'expo/config';
import fs from 'fs';
import path from 'path';

const ADMOB_TEST_APP_IDS = {
  android: 'ca-app-pub-3940256099942544~3347511713',
  ios: 'ca-app-pub-3940256099942544~1458002511',
} as const;

const androidAdMobAppId =
  process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID ?? ADMOB_TEST_APP_IDS.android;
const iosAdMobAppId = process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID ?? ADMOB_TEST_APP_IDS.ios;

/** src/constants/notificationSounds.ts ile aynı dosya adlarını tut. */
const NOTIFICATION_SOUND_ASSET_PATHS = [
  './assets/sounds/ezan.wav',
  './assets/sounds/melody_1.wav',
  './assets/sounds/melody_2.wav',
  './assets/sounds/melody_3.wav',
  './assets/sounds/notification1.mp3',
  './assets/sounds/notification2.mp3',
  './assets/sounds/notification3.mp3',
  './assets/sounds/notification4.mp3',
  './assets/sounds/notification5.mp3',
  './assets/sounds/notification6.mp3',
  './assets/sounds/notification7.mp3',
] as const;

const projectRoot = __dirname;
const bundledNotificationSounds = NOTIFICATION_SOUND_ASSET_PATHS.filter((relativePath) =>
  fs.existsSync(path.join(projectRoot, relativePath)),
);

const config: ExpoConfig = {
  name: 'e-İslam',
  slug: 'e-islam',
  /** Yanlış Expo hesabına build/submit yapılmasını engeller. */
  owner: 'ahmetbingol',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash-screen.png',
    resizeMode: 'cover',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'net.eislam.app',
    infoPlist: {
      LSApplicationQueriesSchemes: ['comgooglemaps', 'maps'],
    },
  },
  android: {
    package: 'net.eislam.app',
    adaptiveIcon: {
      backgroundColor: '#0B1A33',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    [
      'expo-build-properties',
      {
        android: {
          // Expo KSP max Kotlin 2.2.20. RN GMA >=16.1 → Ads 25.x (Kotlin 2.3 / AgeRestrictedTreatment) → pin 16.0.3 + Ads 24.9.
          kotlinVersion: '2.2.20',
        },
      },
    ],
    './plugins/withForcePlayServicesAds',
    './plugins/withFixMainPackage',
    [
      'expo-font',
      {
        fonts: ['./assets/fonts/AmiriBold.ttf'],
      },
    ],
    'expo-asset',
    'expo-dev-client',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-screen.png',
        resizeMode: 'cover',
      },
    ],
    [
      'react-native-google-mobile-ads',
      {
        androidAppId: androidAdMobAppId,
        iosAppId: iosAdMobAppId,
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'Konumunuza göre ezan vakitlerini ve yakın camileri göstermek için konum izni gereklidir.',
      },
    ],
    [
      'expo-notifications',
      {
        color: '#C9A227',
        sounds: bundledNotificationSounds,
      },
    ],
  ],
  extra: {
    ragApiUrl: process.env.EXPO_PUBLIC_RAG_API_URL ?? 'http://localhost:8080',
    revenueCatIosApiKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ?? '',
    revenueCatAndroidApiKey: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY ?? '',
    adMobAndroidAppId: androidAdMobAppId,
    adMobIosAppId: iosAdMobAppId,
    eas: {
      projectId: 'b6932e07-6669-4ab0-813e-3c407c02827d',
    },
  },
};

export default config;

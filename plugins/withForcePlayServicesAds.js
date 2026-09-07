const { withProjectBuildGradle } = require('expo/config-plugins');

/**
 * Expo SDK 54 KSP en fazla Kotlin 2.2.20 destekler.
 * react-native-google-mobile-ads >= 16.1 Ads 25.x (Kotlin 2.3 metadata + AgeRestrictedTreatment) çekiyor.
 * Paket 16.0.3 Ads 24.9.0 kullanır; resolutionStrategy ile sabitle.
 */
const PLAY_SERVICES_ADS_VERSION = '24.9.0';

function withForcePlayServicesAds(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language !== 'groovy') {
      return config;
    }

    const marker = 'forcePlayServicesAdsVersion';
    if (config.modResults.contents.includes(marker)) {
      return config;
    }

    config.modResults.contents += `

// ${marker}: pin Ads SDK for Expo Kotlin/KSP compatibility
ext {
    googleMobileAdsVersion = "${PLAY_SERVICES_ADS_VERSION}"
}
allprojects {
    configurations.all {
        resolutionStrategy {
            force "com.google.android.gms:play-services-ads:${PLAY_SERVICES_ADS_VERSION}"
            force "com.google.android.gms:play-services-ads-lite:${PLAY_SERVICES_ADS_VERSION}"
        }
    }
}
`;

    return config;
  });
}

module.exports = withForcePlayServicesAds;

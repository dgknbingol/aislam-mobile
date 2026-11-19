const { withAndroidManifest } = require('expo/config-plugins');

/**
 * expo-screen-orientation / portrait varsayılanı
 * android.hardware.screen.portrait'i required=true yazar.
 * Play bunu zorunlu donanım sayıp tablet/desktop/XR'da uygulamayı gizler ve
 * inceleme gönderimini keser. required=false yapınca cihazlar yükleyebilir.
 */
function withPortraitFeatureOptional(config) {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    const features = androidManifest.manifest['uses-feature'] ?? [];
    const portrait = features.find(
      (item) => item.$?.['android:name'] === 'android.hardware.screen.portrait',
    );

    if (portrait) {
      portrait.$['android:required'] = 'false';
    } else {
      features.push({
        $: {
          'android:name': 'android.hardware.screen.portrait',
          'android:required': 'false',
        },
      });
    }

    androidManifest.manifest['uses-feature'] = features;
    return config;
  });
}

module.exports = withPortraitFeatureOptional;

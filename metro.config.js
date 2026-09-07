const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// .ttf JS modülü gibi çözülmesin
config.resolver.sourceExts = config.resolver.sourceExts.filter(
  (ext) => ext !== 'ttf' && ext !== 'otf',
);
if (!config.resolver.assetExts.includes('ttf')) {
  config.resolver.assetExts.push('ttf');
}
if (!config.resolver.assetExts.includes('otf')) {
  config.resolver.assetExts.push('otf');
}

module.exports = config;

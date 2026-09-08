const { withMainActivity, withMainApplication } = require('expo/config-plugins');

/**
 * Prebuild, MainActivity/MainApplication dosyalarini android.package dizinine tasiyor
 * ama icindeki `package` satirini slug'dan tureyen eski varsayilanda birakiyor.
 * BuildConfig app/build.gradle'daki namespace ile ayni pakete uretildigi icin,
 * paket satiri uyusmazsa `Unresolved reference 'BuildConfig'` ile derleme coker.
 */
const PACKAGE_DECLARATION = /^package\s+[\w.]+/m;

function setPackageDeclaration(contents, packageName, fileName) {
  if (!PACKAGE_DECLARATION.test(contents)) {
    throw new Error(`withFixMainPackage: ${fileName} icinde package satiri bulunamadi.`);
  }

  return contents.replace(PACKAGE_DECLARATION, `package ${packageName}`);
}

function withFixMainPackage(config) {
  const packageName = config.android?.package;
  if (!packageName) {
    throw new Error('withFixMainPackage: app.config.ts icinde android.package tanimli degil.');
  }

  config = withMainActivity(config, (config) => {
    config.modResults.contents = setPackageDeclaration(
      config.modResults.contents,
      packageName,
      'MainActivity',
    );
    return config;
  });

  return withMainApplication(config, (config) => {
    config.modResults.contents = setPackageDeclaration(
      config.modResults.contents,
      packageName,
      'MainApplication',
    );
    return config;
  });
}

module.exports = withFixMainPackage;

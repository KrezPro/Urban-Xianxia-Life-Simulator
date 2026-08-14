// Config plugin для react-native-iap v13+
// Пакет имеет два product flavors: amazon и play.
// Без явного указания flavor Gradle кидает ambiguity error.
// Этот плагин добавляет missingDimensionStrategy 'store', 'play' в defaultConfig
// app/build.gradle, что заставляет Gradle выбирать Google Play вариант.
const { withAppBuildGradle } = require('@expo/config-plugins');

const withIapPlayFlavor = (config) => {
  return withAppBuildGradle(config, (cfg) => {
    const contents = cfg.modResults.contents || '';
    if (contents.includes("missingDimensionStrategy 'store'")) {
      return cfg;
    }
    const injection = "        missingDimensionStrategy 'store', 'play'";
    // Ищем блок defaultConfig { ... } и вставляем строку сразу после открывающей скобки
    cfg.modResults.contents = contents.replace(
      /defaultConfig\s*\{/,
      `defaultConfig {\n${injection}`
    );
    return cfg;
  });
};

module.exports = withIapPlayFlavor;
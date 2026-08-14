// Конфигурация рекламы и покупок
// Тестовые AdMob ID от Google: https://developers.google.com/admob/android/test-ads
// Замени на реальные ID после создания в AdMob Console
export const AdsConstants = {
  // Продукт IAP для отключения рекламы (должен совпадать с Google Play Console)
  REMOVE_ADS_PRODUCT_ID: 'remove_ads',

  // Тестовые AdMob App ID (вставляются в app.json)
  testAppIds: {
    android: 'ca-app-pub-3940256099942544~3347511713',
    ios: 'ca-app-pub-3940256099942544~1458002511',
  },

  // Тестовые Ad Unit ID (вставляются сюда)
  testAdUnits: {
    android: {
      interstitial: 'ca-app-pub-3940256099942544/1033173712',
      rewarded: 'ca-app-pub-3940256099942544/5224354917',
    },
    ios: {
      interstitial: 'ca-app-pub-3940256099942544/4411468910',
      rewarded: 'ca-app-pub-3940256099942544/1712485313',
    },
  },

  // Политика показа рекламы после смерти
  // 5-я смерть -> первая реклама
  // 8-я смерть -> вторая реклама
  // 9+ смертей -> каждую смерть
  DEATH_AD_POLICY: {
    FIRST_DEATH: 5,
    SECOND_DEATH: 8,
    EVERY_DEATH_AFTER: true,
  },

  // Глобальные флаги
  ADS_ENABLED: true, // Мастер-выключатель всей рекламы
  AGE_ONE_INTERSTITIAL_ENABLED: false, // Старая реклама на 1 году после перерождения (отключена)
};
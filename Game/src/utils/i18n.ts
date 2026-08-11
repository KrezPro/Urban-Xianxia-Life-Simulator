// Легковесная замена i18next для полного устранения ошибок Intl/PluralRules в движке Hermes React Native
const translations: Record<string, string> = {
  age: "Возраст",
  age_button: "Повзрослеть (+1 год)",
  "stats.intelligence": "Интеллект",
  "stats.health": "Здоровье",
  "stats.appearance": "Привлекательность",
  "stats.money": "Финансы",
  "stats.qi": "Духовная энергия (Ци)",
  "stats.karma": "Карма",
  "stats.spiritual_root": "Духовный корень",
};

export const useTranslation = (ns?: string) => {
  return {
    t: (key: string) => {
      return translations[key] || key;
    },
    i18n: {
      language: 'ru',
      changeLanguage: () => {},
    }
  };
};

export default {
  t: (key: string) => translations[key] || key
};
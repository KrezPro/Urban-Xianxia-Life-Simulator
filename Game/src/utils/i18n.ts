// Полностью очищенный модуль локализации без зависимостей от внешних библиотек
const translations: Record<string, string> = {
  age: "Возраст",
  age_button: "Повзрослеть (+1 год)",
};

export const useTranslation = () => {
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
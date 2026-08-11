import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Импортируем созданные ранее словари локализации
import ruUi from '../locales/ru/ui.json';
import ruEvents from '../locales/ru/events.json';
import ruItems from '../locales/ru/items.json';
import ruStages from '../locales/ru/stages.json';

// Объект со всеми ресурсами языков
const resources = {
  ru: {
    ui: ruUi,
    events: ruEvents,
    items: ruItems,
    stages: ruStages,
  },
  // В будущем сюда будет добавлен объект 'en'
};

i18n
  // Передаем экземпляр i18n в react-i18next
  .use(initReactI18next)
  // Инициализируем i18next
  .init({
    resources,
    lng: 'ru', // Язык по умолчанию
    fallbackLng: 'ru', // Резервный язык, если перевод не найден
    ns: ['ui', 'events', 'items', 'stages'], // Доступные неймспейсы (файлы)
    defaultNS: 'ui', // Неймспейс по умолчанию
    interpolation: {
      escapeValue: false, // React уже автоматически экранирует значения для защиты от XSS
    },
    compatibilityJSON: 'v3', // Обязательно для React Native (Hermes) со старым API
  });

export default i18n;
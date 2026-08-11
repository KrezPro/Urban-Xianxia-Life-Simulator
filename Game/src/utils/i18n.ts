import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Встроенные словари локализации для исключения проблем с разрешением JSON-файлов в Metro
const resources = {
  ru: {
    ui: {
      age: "Возраст",
      age_button: "Повзрослеть (+1 год)",
      stats: {
        intelligence: "Интеллект",
        health: "Здоровье",
        appearance: "Привлекательность",
        money: "Финансы",
        qi: "Духовная энергия (Ци)",
        karma: "Карма",
        spiritual_root: "Духовный корень"
      },
      tabs: {
        profile: "Профиль",
        life: "Жизнь",
        dao: "Дао",
        shop: "Магазин"
      },
      actions: {
        breakthrough: "Совершить прорыв",
        meditate: "Медитировать",
        work: "Отправиться на работу",
        study: "Учиться"
      },
      modals: {
        death_title: "Вы погибли",
        reincarnate_button: "Реинкарнировать",
        use_time_machine: "Машина времени (-1 год)"
      }
    },
    events: {
      birth: {
        title: "Инкарнация",
        description: "Вы родились в современном мегаполисе. Небо сегодня странного цвета..."
      },
      mundane: {
        boss_conflict: {
          text: "Ваш босс, похоже, является скрытым демоном низшего ранга. Он заставляет вас работать сверхурочно без оплаты.",
          choices: {
            endure: "Терпеть и копить стресс",
            fight: "Использовать слабую Ци, чтобы сломать ему принтер"
          }
        }
      },
      cultivation: {
        breakthrough_success: {
          text: "Небеса дрогнули! Ваши меридианы расширились, вы успешно перешли на новую стадию."
        },
        breakthrough_fail_minor: {
          text: "Отклонение Ци! Вы сплевываете кровь, ваши меридианы повреждены."
        },
        breakthrough_fail_death: {
          text: "Удар Небесной Скорби испепелил ваше тело прямо на офисном кресле. Вы мертвы."
        }
      }
    },
    items: {
      minor_qi_pill: {
        name: "Малая Пилюля Ци",
        description: "Куплена в даркнете. Содержит примеси, но дает немного энергии.",
        stats: "+10 Ци, шанс отравления 5%"
      },
      corporate_suit: {
        name: "Брендовый костюм",
        description: "Увеличивает шанс повышения на мирской работе.",
        stats: "+5 Привлекательность"
      }
    },
    stages: {
      mortal: {
        name: "Смертный клерк",
        description: "Обычный человек. Максимум, на что вы способны — заварить кофе без помощи рук (пока никто не видит)."
      },
      qi_condensation: {
        name: "Конденсация Ци",
        description: "Вы научились впитывать энергию неоновых вывесок и WiFi роутеров."
      },
      foundation_establishment: {
        name: "Заложение Основ",
        description: "Ваш Даньтянь сформирован. Вы можете игнорировать пробки, летая на мече над МКАДом."
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ru',
    fallbackLng: 'ru',
    ns: ['ui', 'events', 'items', 'stages'],
    defaultNS: 'ui',
    interpolation: {
      escapeValue: false,
    },
    compatibilityJSON: 'v3',
    // Кастомный резолвер для полного обхода Intl.PluralRules в Hermes
    pluralResolver: {
      addRule: () => {},
      resolve: () => ['other']
    }
  });

export default i18n;
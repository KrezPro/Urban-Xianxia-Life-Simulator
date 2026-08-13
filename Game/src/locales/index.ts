import type { Locale } from '../types';

import enUi from './en/ui.json';
import enEvents from './en/events.json';
import enSocial from './en/social.json';
import enNotifications from './en/notifications.json';
import enExtras from './en/extras.json';
import enStages from './en/stages.json';
import enRebirth from './en/rebirth.json';
import enEventGenerator from './en/eventGenerator.json';
import enSettings from './en/settings.json';

import ruUi from './ru/ui.json';
import ruEvents from './ru/events.json';
import ruSocial from './ru/social.json';
import ruNotifications from './ru/notifications.json';
import ruExtras from './ru/extras.json';
import ruStages from './ru/stages.json';
import ruRebirth from './ru/rebirth.json';
import ruEventGenerator from './ru/eventGenerator.json';
import ruSettings from './ru/settings.json';

export type DictionaryName =
  | 'ui'
  | 'events'
  | 'social'
  | 'notifications'
  | 'extras'
  | 'stages'
  | 'rebirth'
  | 'eventGenerator'
  | 'settings';

const emptyDictionaries: Record<DictionaryName, any> = {
  ui: {},
  events: {
    mundane: [],
    secret: [],
  },
  social: {},
  notifications: {},
  extras: {},
  stages: {},
  rebirth: {},
  eventGenerator: {},
  settings: {},
};

export const localeDictionaries: Record<Locale, Record<DictionaryName, any>> = {
  en: {
    ui: enUi,
    events: enEvents,
    social: enSocial,
    notifications: enNotifications,
    extras: enExtras,
    stages: enStages,
    rebirth: enRebirth,
    eventGenerator: enEventGenerator,
    settings: enSettings,
  },
  ru: {
    ui: ruUi,
    events: ruEvents,
    social: ruSocial,
    notifications: ruNotifications,
    extras: ruExtras,
    stages: ruStages,
    rebirth: ruRebirth,
    eventGenerator: ruEventGenerator,
    settings: ruSettings,
  },
  vi: emptyDictionaries,
  id: emptyDictionaries,
  es: emptyDictionaries,
  it: emptyDictionaries,
  kk: emptyDictionaries,
  'zh-Hans': emptyDictionaries,
  'zh-Hant': emptyDictionaries,
  ko: emptyDictionaries,
  ms: emptyDictionaries,
  de: emptyDictionaries,
  pl: emptyDictionaries,
  pt: emptyDictionaries,
  ro: emptyDictionaries,
  sw: emptyDictionaries,
  th: emptyDictionaries,
  tr: emptyDictionaries,
  fil: emptyDictionaries,
  fr: emptyDictionaries,
  hi: emptyDictionaries,
  ja: emptyDictionaries,
};
import { Locale } from '../types';
import { DEFAULT_LOCALE } from '../constants/Locales';
import enUi from '../locales/en/ui.json';
import ruUi from '../locales/ru/ui.json';
import viUi from '../locales/vi/ui.json';
import enSettings from '../locales/en/settings.json';
import ruSettings from '../locales/ru/settings.json';
import viSettings from '../locales/vi/settings.json';

export type DictionaryName = 'ui' | 'settings';

const enDictionaries: Record<DictionaryName, any> = {
  ui: enUi,
  settings: enSettings,
};

const ruDictionaries: Partial<Record<DictionaryName, any>> = {
  ui: ruUi,
  settings: ruSettings,
};

const viDictionaries: Partial<Record<DictionaryName, any>> = {
  ui: viUi,
  settings: viSettings,
};

const KEY_LIKE_PATTERN = /^[a-z0-9_]+(?:\.[a-z0-9_]+)+$/i;

export const getDictionary = (locale: Locale, dictionary: DictionaryName): any => {
  if (locale === 'ru') {
    return ruDictionaries[dictionary] ?? enDictionaries[dictionary];
  }
  if (locale === 'vi') {
    return viDictionaries[dictionary] ?? enDictionaries[dictionary];
  }
  return enDictionaries[dictionary];
};

export const resolvePath = (obj: any, path: string): any => {
  if (!obj || !path) {
    return undefined;
  }
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === undefined || current === null || current[part] === undefined) {
      return undefined;
    }
    current = current[part];
  }
  return current;
};

export const applyParams = (text: string, params?: Record<string, string>): string => {
  if (!params) {
    return text;
  }
  let result = text;
  Object.keys(params).forEach((key) => {
    result = result.split(`{${key}}`).join(params[key]);
  });
  return result;
};

const applyResolvedParams = (
  text: string,
  params: Record<string, string | number> | undefined,
  base: any
): string => {
  if (!params) {
    return text;
  }

  let result = text;
  Object.keys(params).forEach((key) => {
    const rawValue = params[key];
    let replacement = String(rawValue);

    if (typeof rawValue === 'string') {
      const resolved = resolvePath(base, rawValue);
      if (resolved !== undefined) {
        replacement = String(resolved);
      } else if (KEY_LIKE_PATTERN.test(rawValue)) {
        replacement = '';
      }
    }

    result = result.split(`{${key}}`).join(replacement);
  });

  return result;
};

export const resolveLocalizedKey = (
  locale: Locale,
  dictionary: DictionaryName,
  key: string,
  params?: Record<string, string | number>
): string => {
  const base = getDictionary(locale, dictionary);
  let raw = resolvePath(base, key);
  let paramBase = base;

  if ((raw === undefined || typeof raw !== 'string') && locale !== DEFAULT_LOCALE) {
    const fallbackBase = enDictionaries[dictionary];
    const fallbackRaw = resolvePath(fallbackBase, key);
    if (fallbackRaw !== undefined) {
      raw = fallbackRaw;
      paramBase = fallbackBase;
    }
  }

  if (raw === undefined || typeof raw !== 'string') {
    return '';
  }

  return applyResolvedParams(raw, params, paramBase);
};
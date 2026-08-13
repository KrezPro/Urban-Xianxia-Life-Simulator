import type { Locale } from '../types';
import { DEFAULT_LOCALE } from '../constants/Locales';
import { localeDictionaries } from '../locales';
import type { DictionaryName } from '../locales';

export type { DictionaryName };

const KEY_LIKE_PATTERN = /^[a-z0-9_]+(?:\.[a-z0-9_]+)+$/i;

const isUsableString = (value: unknown): value is string => {
  return typeof value === 'string' && value.trim().length > 0;
};

const ensureArray = (value: unknown): any[] => {
  return Array.isArray(value) ? value : [];
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

const getRawDictionary = (locale: Locale, dictionary: DictionaryName): any => {
  const dictionariesForLocale = localeDictionaries[locale] ?? localeDictionaries[DEFAULT_LOCALE];
  const raw = dictionariesForLocale?.[dictionary];
  if (raw !== undefined) {
    return raw;
  }
  return localeDictionaries[DEFAULT_LOCALE]?.[dictionary];
};

const mergeEventList = (baseList: any[], targetList: any[]): any[] => {
  const safeBase = ensureArray(baseList);
  const safeTarget = ensureArray(targetList);

  if (safeBase.length === 0) {
    return safeTarget;
  }
  if (safeTarget.length === 0) {
    return safeBase;
  }

  const targetMap = new Map<string, any>();
  safeTarget.forEach((item) => {
    if (item && typeof item.id === 'string') {
      targetMap.set(item.id, item);
    }
  });

  const merged = safeBase.map((baseItem) => {
    if (!baseItem || typeof baseItem.id !== 'string') {
      return baseItem;
    }
    const targetItem = targetMap.get(baseItem.id);
    if (targetItem && isUsableString(targetItem.text)) {
      return {
        ...baseItem,
        ...targetItem,
        effects: targetItem.effects ?? baseItem.effects,
      };
    }
    return baseItem;
  });

  const baseIds = new Set(
    safeBase
      .map((item) => (item && typeof item.id === 'string' ? item.id : undefined))
      .filter(Boolean)
  );

  safeTarget.forEach((targetItem) => {
    if (
      targetItem &&
      typeof targetItem.id === 'string' &&
      !baseIds.has(targetItem.id) &&
      isUsableString(targetItem.text)
    ) {
      merged.push(targetItem);
    }
  });

  return merged;
};

const eventsCache = new Map<Locale, any>();

const getEventsDictionary = (locale: Locale): any => {
  const cached = eventsCache.get(locale);
  if (cached) {
    return cached;
  }

  const enEvents = getRawDictionary(DEFAULT_LOCALE, 'events') ?? {};
  const baseMundane = ensureArray(enEvents?.mundane);
  const baseSecret = ensureArray(enEvents?.secret);

  if (locale === DEFAULT_LOCALE) {
    const result = {
      mundane: baseMundane,
      secret: baseSecret,
    };
    eventsCache.set(locale, result);
    return result;
  }

  const targetEvents = getRawDictionary(locale, 'events') ?? {};
  const result = {
    mundane: mergeEventList(baseMundane, ensureArray(targetEvents?.mundane)),
    secret: mergeEventList(baseSecret, ensureArray(targetEvents?.secret)),
  };

  eventsCache.set(locale, result);
  return result;
};

export const getDictionary = (locale: Locale, dictionary: DictionaryName): any => {
  if (dictionary === 'events') {
    return getEventsDictionary(locale);
  }
  return getRawDictionary(locale, dictionary);
};

export const applyParams = (text: string, params?: Record<string, string | number>): string => {
  if (!params) {
    return text;
  }
  let result = text;
  Object.entries(params).forEach(([key, value]) => {
    result = result.split(`{${key}}`).join(String(value));
  });
  return result;
};

const resolveParamValue = (
  rawValue: string | number,
  locale: Locale,
  dictionary: DictionaryName
): string => {
  if (typeof rawValue === 'number') {
    return String(rawValue);
  }
  if (typeof rawValue !== 'string') {
    return '';
  }
  if (!KEY_LIKE_PATTERN.test(rawValue)) {
    return rawValue;
  }

  const targetBase = getRawDictionary(locale, dictionary);
  const targetResolved = resolvePath(targetBase, rawValue);
  if (isUsableString(targetResolved)) {
    return targetResolved;
  }
  if (typeof targetResolved === 'number') {
    return String(targetResolved);
  }

  if (locale !== DEFAULT_LOCALE) {
    const enBase = getRawDictionary(DEFAULT_LOCALE, dictionary);
    const enResolved = resolvePath(enBase, rawValue);
    if (isUsableString(enResolved)) {
      return enResolved;
    }
    if (typeof enResolved === 'number') {
      return String(enResolved);
    }
  }

  return '';
};

const applyResolvedParams = (
  text: string,
  params: Record<string, string | number> | undefined,
  locale: Locale,
  dictionary: DictionaryName
): string => {
  if (!params) {
    return text;
  }
  let result = text;
  Object.entries(params).forEach(([key, rawValue]) => {
    const replacement = resolveParamValue(rawValue, locale, dictionary);
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
  const base = getRawDictionary(locale, dictionary);
  let raw = resolvePath(base, key);

  if (!isUsableString(raw) && locale !== DEFAULT_LOCALE) {
    const fallbackBase = getRawDictionary(DEFAULT_LOCALE, dictionary);
    const fallbackRaw = resolvePath(fallbackBase, key);
    if (isUsableString(fallbackRaw)) {
      raw = fallbackRaw;
    }
  }

  if (!isUsableString(raw)) {
    return '';
  }

  return applyResolvedParams(raw, params, locale, dictionary);
};
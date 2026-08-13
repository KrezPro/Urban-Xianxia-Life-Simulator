import { useCallback } from 'react';
import { useLocaleStore } from '../store/useLocaleStore';
import { resolveLocalizedKey } from '../utils/i18n';
import type { DictionaryName } from '../utils/i18n';

export const useTranslator = (dictionary: DictionaryName) => {
  const locale = useLocaleStore((state) => state.locale);

  return useCallback(
    (key: string, params?: Record<string, string | number>) =>
      resolveLocalizedKey(locale, dictionary, key, params),
    [locale, dictionary]
  );
};
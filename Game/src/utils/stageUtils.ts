import { Locale } from '../types';
import { resolveLocalizedKey } from './i18n';

export const getStageName = (stageId: string, locale: Locale): string => {
  const resolved = resolveLocalizedKey(locale, 'stages', stageId);
  return resolved || stageId;
};
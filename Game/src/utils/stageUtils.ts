import { Locale } from '../types';
import ruStages from '../locales/ru/stages.json';
import enStages from '../locales/en/stages.json';

export const getStageName = (stageId: string, locale: Locale): string => {
  const dictionary: any = locale === 'ru' ? ruStages : enStages;
  return dictionary[stageId] || stageId;
};
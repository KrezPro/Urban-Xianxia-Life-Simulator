import { Locale } from '../types';

export interface SupportedLocale {
  code: Locale;
  englishName: string;
  nativeName: string;
}

export const DEFAULT_LOCALE: Locale = 'en';

export const SUPPORTED_LOCALES: SupportedLocale[] = [
  { code: 'en', englishName: 'English', nativeName: 'English' },
  { code: 'vi', englishName: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'id', englishName: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  { code: 'es', englishName: 'Spanish', nativeName: 'Español' },
  { code: 'it', englishName: 'Italian', nativeName: 'Italiano' },
  { code: 'kk', englishName: 'Kazakh', nativeName: 'Қазақша' },
  { code: 'zh-Hans', englishName: 'Chinese (Simplified)', nativeName: '中文（简体）' },
  { code: 'zh-Hant', englishName: 'Chinese (Traditional)', nativeName: '中文（繁體）' },
  { code: 'ko', englishName: 'Korean', nativeName: '한국어' },
  { code: 'ms', englishName: 'Malay', nativeName: 'Bahasa Melayu' },
  { code: 'de', englishName: 'German', nativeName: 'Deutsch' },
  { code: 'pl', englishName: 'Polish', nativeName: 'Polski' },
  { code: 'pt', englishName: 'Portuguese', nativeName: 'Português' },
  { code: 'ro', englishName: 'Romanian', nativeName: 'Română' },
  { code: 'ru', englishName: 'Russian', nativeName: 'Русский' },
  { code: 'sw', englishName: 'Swahili', nativeName: 'Kiswahili' },
  { code: 'th', englishName: 'Thai', nativeName: 'ไทย' },
  { code: 'tr', englishName: 'Turkish', nativeName: 'Türkçe' },
  { code: 'fil', englishName: 'Filipino', nativeName: 'Filipino' },
  { code: 'fr', englishName: 'French', nativeName: 'Français' },
  { code: 'hi', englishName: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ja', englishName: 'Japanese', nativeName: '日本語' },
];

export const isLocale = (value: unknown): value is Locale => {
  return typeof value === 'string' && SUPPORTED_LOCALES.some((item) => item.code === value);
};

export const getSupportedLocale = (code: Locale): SupportedLocale => {
  return SUPPORTED_LOCALES.find((item) => item.code === code) ?? SUPPORTED_LOCALES[0];
};

export const normalizeLocale = (raw?: string | null): Locale | undefined => {
  if (!raw || typeof raw !== 'string') {
    return undefined;
  }

  const cleaned = raw.trim().toLowerCase().replace(/_/g, '-');
  if (!cleaned) {
    return undefined;
  }

  if (cleaned.startsWith('zh')) {
    if (
      cleaned.includes('hant') ||
      cleaned.includes('tw') ||
      cleaned.includes('hk') ||
      cleaned.includes('mo')
    ) {
      return 'zh-Hant';
    }
    return 'zh-Hans';
  }

  const primary = cleaned.split('-')[0];
  const aliases: Record<string, Locale> = {
    tl: 'fil',
    in: 'id',
    zh: 'zh-Hans',
  };

  const candidate: string = aliases[primary] ?? primary;
  return isLocale(candidate) ? candidate : undefined;
};

export const getDeviceLocaleCandidate = (): Locale | undefined => {
  try {
    if (typeof Intl !== 'undefined' && typeof Intl.DateTimeFormat === 'function') {
      const raw = Intl.DateTimeFormat().resolvedOptions().locale;
      return normalizeLocale(raw);
    }
  } catch {
    return undefined;
  }

  return undefined;
};
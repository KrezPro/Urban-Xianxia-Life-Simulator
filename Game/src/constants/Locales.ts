import { Locale } from '../types';

export interface SupportedLocale {
  code: Locale;
  nativeName: string;
  englishName: string;
}

export const DEFAULT_LOCALE: Locale = 'en';

export const SUPPORTED_LOCALES: SupportedLocale[] = [
  { code: 'en', nativeName: 'English', englishName: 'English' },
  { code: 'vi', nativeName: 'Tiếng Việt', englishName: 'Vietnamese' },
  { code: 'id', nativeName: 'Bahasa Indonesia', englishName: 'Indonesian' },
  { code: 'es', nativeName: 'Español', englishName: 'Spanish' },
  { code: 'it', nativeName: 'Italiano', englishName: 'Italian' },
  { code: 'kk', nativeName: 'Қазақша', englishName: 'Kazakh' },
  { code: 'zh-Hans', nativeName: '中文（简体）', englishName: 'Chinese (Simplified)' },
  { code: 'zh-Hant', nativeName: '中文（繁體）', englishName: 'Chinese (Traditional)' },
  { code: 'ko', nativeName: '한국어', englishName: 'Korean' },
  { code: 'ms', nativeName: 'Bahasa Melayu', englishName: 'Malay' },
  { code: 'de', nativeName: 'Deutsch', englishName: 'German' },
  { code: 'pl', nativeName: 'Polski', englishName: 'Polish' },
  { code: 'pt', nativeName: 'Português', englishName: 'Portuguese' },
  { code: 'ro', nativeName: 'Română', englishName: 'Romanian' },
  { code: 'ru', nativeName: 'Русский', englishName: 'Russian' },
  { code: 'sw', nativeName: 'Kiswahili', englishName: 'Swahili' },
  { code: 'th', nativeName: 'ไทย', englishName: 'Thai' },
  { code: 'tr', nativeName: 'Türkçe', englishName: 'Turkish' },
  { code: 'fil', nativeName: 'Filipino', englishName: 'Filipino' },
  { code: 'fr', nativeName: 'Français', englishName: 'French' },
  { code: 'hi', nativeName: 'हिन्दी', englishName: 'Hindi' },
  { code: 'ja', nativeName: '日本語', englishName: 'Japanese' },
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

  const candidate = aliases[primary] ?? primary;
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
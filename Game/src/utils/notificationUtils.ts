import { INotification, IEventLog, Locale } from '../types';
import ruNotifications from '../locales/ru/notifications.json';
import enNotifications from '../locales/en/notifications.json';
import ruEvents from '../locales/ru/events.json';
import enEvents from '../locales/en/events.json';
import ruEventGenerator from '../locales/ru/eventGenerator.json';
import enEventGenerator from '../locales/en/eventGenerator.json';

const KEY_LIKE_PATTERN = /^[a-z0-9_]+(?:\.[a-z0-9_]+)+$/i;

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

const getDictionaryBase = (dictionary: string, locale: Locale): any => {
  if (dictionary === 'eventGenerator') {
    return locale === 'ru' ? ruEventGenerator : enEventGenerator;
  }

  if (dictionary === 'rebirth') {
    return locale === 'ru' ? ruNotifications : enNotifications;
  }

  return locale === 'ru' ? ruNotifications : enNotifications;
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

const applyResolvedParams = (text: string, params: Record<string, string | number> | undefined, base: any): string => {
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

const localize = (
  locale: Locale,
  dictionary: string,
  key: string,
  params?: Record<string, string | number>
): string | undefined => {
  const base = getDictionaryBase(dictionary, locale);
  const raw = resolvePath(base, key);

  if (raw === undefined || typeof raw !== 'string') {
    return undefined;
  }

  return applyResolvedParams(raw, params, base);
};

const getFallbackBody = (notification: INotification, locale: Locale): string => {
  const base: any = locale === 'ru' ? ruEventGenerator : enEventGenerator;

  if (notification.type === 'danger') {
    return base.fallback?.danger || notification.messageKey;
  }

  if (notification.kind === 'generated' || notification.kind === 'event') {
    return base.fallback?.event || notification.messageKey;
  }

  return base.fallback?.ui || notification.messageKey;
};

export const getNotificationTitle = (notification: INotification, locale: Locale): string => {
  if (notification.titleKey) {
    const resolved = localize(locale, notification.dictionary || 'eventGenerator', notification.titleKey, notification.params);

    if (resolved !== undefined) {
      return resolved;
    }
  }

  const byType = localize(locale, 'eventGenerator', `notification_titles.${notification.type}`);
  return byType || '';
};

export const getNotificationBody = (notification: INotification, locale: Locale): string => {
  if (notification.textKey) {
    const resolved = localize(locale, notification.dictionary || 'eventGenerator', notification.textKey, notification.params);

    if (resolved !== undefined) {
      return resolved;
    }
  }

  if (notification.kind === 'event') {
    const events: any = locale === 'ru' ? ruEvents : enEvents;
    const pool = notification.eventPool || 'mundane';
    const list = events[pool] || [];
    const found = list.find((event: any) => event.id === notification.messageKey);

    if (found) {
      return applyParams(found.text, notification.params);
    }
  }

  const dictionary: any = locale === 'ru' ? ruNotifications : enNotifications;
  const raw = dictionary[notification.messageKey];

  if (raw !== undefined) {
    return applyParams(raw, notification.params);
  }

  return getFallbackBody(notification, locale);
};

export const getNotificationText = (notification: INotification, locale: Locale): string => {
  return getNotificationBody(notification, locale);
};

export const getEventLogText = (log: IEventLog, locale: Locale): string => {
  if (log.generated && log.textKey) {
    const resolved = localize(locale, 'eventGenerator', log.textKey, log.params);

    if (resolved !== undefined) {
      return resolved;
    }

    const fallback: any = locale === 'ru' ? ruEventGenerator : enEventGenerator;
    return fallback.fallback?.event || '';
  }

  return log.text || '';
};
import { INotification, IEventLog, Locale } from '../types';
import ruNotifications from '../locales/ru/notifications.json';
import enNotifications from '../locales/en/notifications.json';
import ruEvents from '../locales/ru/events.json';
import enEvents from '../locales/en/events.json';
import ruEventGenerator from '../locales/ru/eventGenerator.json';
import enEventGenerator from '../locales/en/eventGenerator.json';
import ruRebirth from '../locales/ru/rebirth.json';
import enRebirth from '../locales/en/rebirth.json';

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
    return locale === 'ru' ? ruRebirth : enRebirth;
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
      }
    }

    result = result.split(`{${key}}`).join(replacement);
  });

  return result;
};

export const resolveLocalizedKey = (
  locale: Locale,
  dictionary: string,
  key: string,
  params?: Record<string, string | number>
): string => {
  const base = getDictionaryBase(dictionary, locale);
  const raw = resolvePath(base, key);

  if (raw === undefined) {
    return key;
  }

  return applyResolvedParams(String(raw), params, base);
};

export const getNotificationTitle = (notification: INotification, locale: Locale): string => {
  if (!notification.titleKey) {
    return '';
  }

  return resolveLocalizedKey(locale, notification.dictionary || 'eventGenerator', notification.titleKey, notification.params);
};

export const getNotificationBody = (notification: INotification, locale: Locale): string => {
  if (notification.textKey) {
    return resolveLocalizedKey(locale, notification.dictionary || 'eventGenerator', notification.textKey, notification.params);
  }

  if (notification.kind === 'event') {
    const events: any = locale === 'ru' ? ruEvents : enEvents;
    const pool = notification.eventPool || 'mundane';
    const list = events[pool] || [];
    const found = list.find((event: any) => event.id === notification.messageKey);
    return found ? applyParams(found.text, notification.params) : notification.messageKey;
  }

  const dictionary: any = locale === 'ru' ? ruNotifications : enNotifications;
  const raw = dictionary[notification.messageKey] || notification.messageKey;
  return applyParams(raw, notification.params);
};

export const getNotificationText = (notification: INotification, locale: Locale): string => {
  return getNotificationBody(notification, locale);
};

export const getEventLogText = (log: IEventLog, locale: Locale): string => {
  if (log.generated && log.textKey) {
    return resolveLocalizedKey(locale, 'eventGenerator', log.textKey, log.params);
  }

  return log.text || '';
};
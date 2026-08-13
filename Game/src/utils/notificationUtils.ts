import { INotification, IEventLog, Locale } from '../types';
import {
  applyParams,
  getDictionary,
  resolveLocalizedKey as resolveLocalizedKeyBase,
  resolvePath,
  DictionaryName,
} from './i18n';

export { applyParams, resolvePath };

export const resolveLocalizedKey = (
  locale: Locale,
  dictionary: string,
  key: string,
  params?: Record<string, string | number>
): string => {
  return resolveLocalizedKeyBase(locale, dictionary as DictionaryName, key, params);
};

export const getNotificationTitle = (notification: INotification, locale: Locale): string => {
  if (!notification.titleKey) {
    return '';
  }

  const resolved = resolveLocalizedKey(
    locale,
    notification.dictionary || 'eventGenerator',
    notification.titleKey,
    notification.params
  );

  if (resolved) {
    return resolved;
  }

  const byType = resolveLocalizedKey(
    locale,
    'eventGenerator',
    `notification_titles.${notification.type}`
  );

  return byType || '';
};

export const getNotificationBody = (notification: INotification, locale: Locale): string => {
  if (notification.textKey) {
    const resolved = resolveLocalizedKey(
      locale,
      notification.dictionary || 'eventGenerator',
      notification.textKey,
      notification.params
    );

    if (resolved) {
      return resolved;
    }
  }

  if (notification.kind === 'event') {
    const events: any = getDictionary(locale, 'events');
    const pool = notification.eventPool || 'mundane';
    const list = Array.isArray(events?.[pool]) ? events[pool] : [];
    const found = list.find((event: any) => event.id === notification.messageKey);

    if (found?.text) {
      return applyParams(found.text, notification.params);
    }
  }

  const resolvedMessage = resolveLocalizedKey(
    locale,
    'notifications',
    notification.messageKey,
    notification.params
  );

  if (resolvedMessage) {
    return resolvedMessage;
  }

  const fallback = resolveLocalizedKey(locale, 'eventGenerator', 'fallback.event');
  return fallback || notification.messageKey;
};

export const getNotificationText = (notification: INotification, locale: Locale): string => {
  return getNotificationBody(notification, locale);
};

export const getEventLogText = (log: IEventLog, locale: Locale): string => {
  if (log.generated && log.textKey) {
    const resolved = resolveLocalizedKey(locale, 'eventGenerator', log.textKey, log.params);

    if (resolved) {
      return resolved;
    }

    const fallback = resolveLocalizedKey(locale, 'eventGenerator', 'fallback.event');
    return fallback || '';
  }

  return log.text || '';
};
import { INotification, Locale } from '../types';
import ruNotifications from '../locales/ru/notifications.json';
import enNotifications from '../locales/en/notifications.json';
import ruEvents from '../locales/ru/events.json';
import enEvents from '../locales/en/events.json';

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

export const getNotificationText = (notification: INotification, locale: Locale): string => {
  if (notification.kind === 'event') {
    const events = locale === 'ru' ? ruEvents : enEvents;
    const pool = notification.eventPool || 'mundane';
    const list = (events as any)[pool] || [];
    const found = list.find((event: any) => event.id === notification.messageKey);

    return found ? found.text : notification.messageKey;
  }

  const dictionary = locale === 'ru' ? ruNotifications : enNotifications;
  const raw = (dictionary as any)[notification.messageKey] || notification.messageKey;

  return applyParams(raw, notification.params);
};
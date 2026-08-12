import { create } from 'zustand';
import { GeneratedEvent, INotification, NotificationKind, NotificationType } from '../types';
import { GameConstants } from '../constants/GameConstants';

interface NotificationState {
  notifications: INotification[];
  pushUiNotification: (
    messageKey: string,
    type: NotificationType,
    params?: Record<string, string>,
    durationMs?: number
  ) => void;
  pushEventNotification: (
    eventId: string,
    eventPool: 'mundane' | 'secret',
    type: NotificationType,
    durationMs?: number
  ) => void;
  pushGeneratedEventNotification: (event: GeneratedEvent) => void;
  dismissNotification: (id: string) => void;
  clearAll: () => void;
}

let notificationCounter = 0;

const appendNotification = (state: NotificationState, notification: INotification): Partial<NotificationState> => {
  return {
    notifications: [notification, ...state.notifications].slice(0, GameConstants.NOTIFICATION_MAX_QUEUE),
  };
};

const createBaseNotification = (
  kind: NotificationKind,
  messageKey: string,
  type: NotificationType,
  durationMs?: number
): INotification => {
  notificationCounter += 1;

  return {
    id: `notification_${Date.now().toString()}_${notificationCounter.toString()}`,
    kind,
    messageKey,
    type,
    createdAt: Date.now(),
    durationMs: durationMs || GameConstants.NOTIFICATION_DURATION_MS,
  };
};

export const useNotificationStore = create<NotificationState>()((set) => ({
  notifications: [],
  pushUiNotification: (messageKey, type, params, durationMs) => {
    const notification = createBaseNotification('ui', messageKey, type, durationMs);
    notification.params = params;

    set((state) => appendNotification(state, notification));
  },
  pushEventNotification: (eventId, eventPool, type, durationMs) => {
    const notification = createBaseNotification('event', eventId, type, durationMs);
    notification.eventPool = eventPool;

    set((state) => appendNotification(state, notification));
  },
  pushGeneratedEventNotification: (event) => {
    const notification = createBaseNotification(
      'generated',
      'generated_event',
      event.logType === 'secret' ? 'secret' : 'mundane',
      GameConstants.EVENT_NOTIFICATION_DURATION_MS
    );

    notification.titleKey = event.titleKey;
    notification.textKey = event.textKey;
    notification.params = Object.fromEntries(
      Object.entries(event.params).map(([key, value]) => [key, String(value)])
    );
    notification.effects = event.displayEffects;
    notification.rarity = event.rarity;
    notification.tone = event.tone;
    notification.dictionary = 'eventGenerator';

    set((state) => appendNotification(state, notification));
  },
  dismissNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((item) => item.id !== id),
    }));
  },
  clearAll: () => {
    set({ notifications: [] });
  },
}));
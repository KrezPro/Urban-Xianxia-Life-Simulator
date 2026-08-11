import { create } from 'zustand';
import { GameConstants } from '../constants/GameConstants';
import { INotification, NotificationKind, NotificationType } from '../types';

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
  dismissNotification: (id: string) => void;
  clearAll: () => void;
}

let notificationCounter = 0;

const createId = (): string => {
  notificationCounter += 1;
  return `${Date.now().toString()}_${notificationCounter.toString()}`;
};

export const useNotificationStore = create<NotificationState>()((set) => ({
  notifications: [],

  pushUiNotification: (messageKey, type, params, durationMs) => {
    const notification: INotification = {
      id: createId(),
      kind: 'ui' as NotificationKind,
      messageKey,
      params,
      type,
      createdAt: Date.now(),
      durationMs: durationMs || GameConstants.NOTIFICATION_DEFAULT_DURATION_MS,
    };

    set((state) => ({
      notifications: [notification, ...state.notifications].slice(0, GameConstants.NOTIFICATION_MAX_QUEUE),
    }));
  },

  pushEventNotification: (eventId, eventPool, type, durationMs) => {
    const notification: INotification = {
      id: createId(),
      kind: 'event' as NotificationKind,
      messageKey: eventId,
      eventPool,
      type,
      createdAt: Date.now(),
      durationMs: durationMs || GameConstants.NOTIFICATION_DEFAULT_DURATION_MS,
    };

    set((state) => ({
      notifications: [notification, ...state.notifications].slice(0, GameConstants.NOTIFICATION_MAX_QUEUE),
    }));
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
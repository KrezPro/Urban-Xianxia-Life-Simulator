import { create } from 'zustand';
import { INotification, NotificationKind, NotificationType } from '../types';
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
  dismissNotification: (id: string) => void;
  clearAll: () => void;
}

let notificationCounter = 0;

const createNotification = (
  kind: NotificationKind,
  messageKey: string,
  type: NotificationType,
  params?: Record<string, string>,
  eventPool?: 'mundane' | 'secret',
  durationMs?: number
): INotification => {
  notificationCounter += 1;

  return {
    id: `notification_${Date.now().toString()}_${notificationCounter.toString()}`,
    kind,
    messageKey,
    eventPool,
    params,
    type,
    createdAt: Date.now(),
    durationMs: durationMs || GameConstants.NOTIFICATION_DURATION_MS,
  };
};

export const useNotificationStore = create<NotificationState>()((set) => ({
  notifications: [],

  pushUiNotification: (messageKey, type, params, durationMs) => {
    const notification = createNotification('ui', messageKey, type, params, undefined, durationMs);

    set({
      notifications: [notification].slice(0, GameConstants.NOTIFICATION_MAX_QUEUE),
    });
  },

  pushEventNotification: (eventId, eventPool, type, durationMs) => {
    const notification = createNotification('event', eventId, type, undefined, eventPool, durationMs);

    set({
      notifications: [notification].slice(0, GameConstants.NOTIFICATION_MAX_QUEUE),
    });
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
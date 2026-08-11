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

const createNotification = (partial: Partial<INotification>): INotification => {
  notificationCounter += 1;

  return {
    id: `notification_${Date.now().toString()}_${notificationCounter.toString()}`,
    kind: 'ui' as NotificationKind,
    messageKey: '',
    type: 'system',
    createdAt: Date.now(),
    durationMs: GameConstants.NOTIFICATION_DEFAULT_DURATION_MS,
    ...partial,
  };
};

export const useNotificationStore = create<NotificationState>()((set) => ({
  notifications: [],

  pushUiNotification: (messageKey, type, params, durationMs) => {
    set((state) => ({
      notifications: [
        createNotification({
          kind: 'ui',
          messageKey,
          type,
          params,
          durationMs,
        }),
        ...state.notifications,
      ].slice(0, GameConstants.NOTIFICATION_MAX_QUEUE),
    }));
  },

  pushEventNotification: (eventId, eventPool, type, durationMs) => {
    set((state) => ({
      notifications: [
        createNotification({
          kind: 'event',
          messageKey: eventId,
          eventPool,
          type,
          durationMs,
        }),
        ...state.notifications,
      ].slice(0, GameConstants.NOTIFICATION_MAX_QUEUE),
    }));
  },

  dismissNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((notification) => notification.id !== id),
    }));
  },

  clearAll: () => {
    set({ notifications: [] });
  },
}));
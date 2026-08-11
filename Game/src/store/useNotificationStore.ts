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

export const useNotificationStore = create<NotificationState>()((set) => ({
  notifications: [],
  pushUiNotification: (messageKey, type, params, durationMs) =>
    set((state) => ({
      notifications: [
        {
          id: Date.now().toString() + Math.random().toString(),
          kind: 'ui' as NotificationKind,
          messageKey,
          params,
          type,
          createdAt: Date.now(),
          durationMs: durationMs || GameConstants.NOTIFICATION_DEFAULT_DURATION_MS,
        },
        ...state.notifications,
      ].slice(0, GameConstants.NOTIFICATION_MAX_QUEUE),
    })),
  pushEventNotification: (eventId, eventPool, type, durationMs) =>
    set((state) => ({
      notifications: [
        {
          id: Date.now().toString() + Math.random().toString(),
          kind: 'event' as NotificationKind,
          messageKey: eventId,
          eventPool,
          type,
          createdAt: Date.now(),
          durationMs: durationMs || GameConstants.NOTIFICATION_DEFAULT_DURATION_MS,
        },
        ...state.notifications,
      ].slice(0, GameConstants.NOTIFICATION_MAX_QUEUE),
    })),
  dismissNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
  clearAll: () => set({ notifications: [] }),
}));
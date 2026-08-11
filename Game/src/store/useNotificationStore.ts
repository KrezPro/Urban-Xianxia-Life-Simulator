import { create } from 'zustand';
import { GameConstants } from '../constants/GameConstants';

export type NotificationType = 'mundane' | 'secret' | 'system' | 'reward' | 'danger' | 'social';

export interface INotificationItem {
  id: string;
  kind: 'ui' | 'event';
  messageKey: string;
  eventPool?: 'mundane' | 'secret';
  params?: Record<string, string>;
  type: NotificationType;
  createdAt: number;
  durationMs: number;
}

interface NotificationState {
  notifications: INotificationItem[];
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
  pruneExpired: () => void;
}

const createId = (): string => {
  return `${Date.now().toString()}_${Math.random().toString(36).slice(2)}`;
};

export const useNotificationStore = create<NotificationState>()((set) => ({
  notifications: [],

  pushUiNotification: (messageKey, type, params, durationMs) => {
    const notification: INotificationItem = {
      id: createId(),
      kind: 'ui',
      messageKey,
      params,
      type,
      createdAt: Date.now(),
      durationMs: durationMs || GameConstants.NOTIFICATION_DEFAULT_DURATION_MS,
    };

    set({ notifications: [notification] });
  },

  pushEventNotification: (eventId, eventPool, type, durationMs) => {
    const notification: INotificationItem = {
      id: createId(),
      kind: 'event',
      messageKey: eventId,
      eventPool,
      type,
      createdAt: Date.now(),
      durationMs: durationMs || GameConstants.NOTIFICATION_DEFAULT_DURATION_MS,
    };

    set({ notifications: [notification] });
  },

  dismissNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((item) => item.id !== id),
    }));
  },

  pruneExpired: () => {
    const now = Date.now();

    set((state) => ({
      notifications: state.notifications.filter((item) => item.createdAt + item.durationMs > now),
    }));
  },
}));
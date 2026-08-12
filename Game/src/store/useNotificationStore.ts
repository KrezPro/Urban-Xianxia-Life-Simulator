import { create } from 'zustand';
import { INotification, NotificationKind, NotificationType } from '../types';
import { GameConstants } from '../constants/GameConstants';

interface CreateNotificationInput {
  kind: NotificationKind;
  messageKey: string;
  eventPool?: 'mundane' | 'secret';
  params?: Record<string, string>;
  type: NotificationType;
  durationMs?: number;
}

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
  pruneExpired: () => void;
}

let notificationCounter = 0;

const createNotification = (input: CreateNotificationInput): INotification => {
  notificationCounter += 1;

  return {
    id: `notification_${Date.now().toString()}_${notificationCounter.toString()}`,
    kind: input.kind,
    messageKey: input.messageKey,
    eventPool: input.eventPool,
    params: input.params,
    type: input.type,
    createdAt: Date.now(),
    durationMs: input.durationMs || GameConstants.NOTIFICATION_DURATION_MS,
  };
};

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: [],

  pushUiNotification: (messageKey, type, params, durationMs) => {
    const notification = createNotification({
      kind: 'ui',
      messageKey,
      type,
      params,
      durationMs,
    });

    set({
      notifications: [notification].slice(0, GameConstants.NOTIFICATION_MAX_QUEUE),
    });
  },

  pushEventNotification: (eventId, eventPool, type, durationMs) => {
    const notification = createNotification({
      kind: 'event',
      messageKey: eventId,
      eventPool,
      type,
      durationMs,
    });

    set({
      notifications: [notification].slice(0, GameConstants.NOTIFICATION_MAX_QUEUE),
    });
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
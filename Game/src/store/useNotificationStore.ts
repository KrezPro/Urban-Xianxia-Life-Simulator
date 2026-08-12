import { create } from 'zustand';
import { EffectChip, EventRarity, EventTone, INotification, NotificationKind, NotificationType } from '../types';
import { GameConstants } from '../constants/GameConstants';

interface RichNotificationOptions {
  kind: NotificationKind;
  messageKey: string;
  type: NotificationType;
  priority?: number;
  group?: string;
  params?: Record<string, string>;
  eventPool?: 'mundane' | 'secret';
  titleKey?: string;
  textKey?: string;
  effects?: EffectChip[];
  rarity?: EventRarity;
  tone?: EventTone;
  dictionary?: 'notifications' | 'eventGenerator' | 'rebirth';
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
  pushGeneratedEventNotification: (options: RichNotificationOptions) => void;
  pushRichNotification: (options: RichNotificationOptions) => void;
  dismissNotification: (id: string) => void;
  clearAll: () => void;
}

let notificationCounter = 0;

const createRichNotification = (options: RichNotificationOptions): INotification => {
  notificationCounter += 1;

  return {
    id: `notification_${Date.now().toString()}_${notificationCounter.toString()}`,
    kind: options.kind,
    messageKey: options.messageKey,
    eventPool: options.eventPool,
    params: options.params,
    type: options.type,
    createdAt: Date.now(),
    durationMs: options.durationMs || GameConstants.NOTIFICATION_DURATION_MS,
    priority: options.priority ?? GameConstants.NOTIFICATION_PRIORITY.minor,
    group: options.group,
    titleKey: options.titleKey,
    textKey: options.textKey,
    effects: options.effects,
    rarity: options.rarity,
    tone: options.tone,
    dictionary: options.dictionary || 'notifications',
  };
};

const isNotificationActive = (notification: INotification): boolean => {
  return notification.createdAt + notification.durationMs > Date.now();
};

const shouldReplaceCurrent = (current: INotification | undefined, next: INotification): boolean => {
  if (!current) {
    return true;
  }

  if (!isNotificationActive(current)) {
    return true;
  }

  const currentPriority = current.priority ?? 0;
  const nextPriority = next.priority ?? 0;

  if (nextPriority > currentPriority) {
    return true;
  }

  if (nextPriority === currentPriority && current.group && current.group === next.group) {
    return true;
  }

  return false;
};

export const useNotificationStore = create<NotificationState>()((set) => ({
  notifications: [],
  pushUiNotification: (messageKey, type, params, durationMs) => {
    const notification = createRichNotification({
      kind: 'ui',
      messageKey,
      type,
      params,
      durationMs,
      priority: GameConstants.NOTIFICATION_PRIORITY.userAction,
      dictionary: 'notifications',
    });

    set((state) => {
      if (!shouldReplaceCurrent(state.notifications[0], notification)) {
        return state;
      }

      return { notifications: [notification] };
    });
  },
  pushEventNotification: (eventId, eventPool, type, durationMs) => {
    const notification = createRichNotification({
      kind: 'event',
      messageKey: eventId,
      eventPool,
      type,
      durationMs,
      priority: GameConstants.NOTIFICATION_PRIORITY.generatedEvent,
      dictionary: 'notifications',
    });

    set((state) => {
      if (!shouldReplaceCurrent(state.notifications[0], notification)) {
        return state;
      }

      return { notifications: [notification] };
    });
  },
  pushGeneratedEventNotification: (options) => {
    const notification = createRichNotification(options);

    set((state) => {
      if (!shouldReplaceCurrent(state.notifications[0], notification)) {
        return state;
      }

      return { notifications: [notification] };
    });
  },
  pushRichNotification: (options) => {
    const notification = createRichNotification(options);

    set((state) => {
      if (!shouldReplaceCurrent(state.notifications[0], notification)) {
        return state;
      }

      return { notifications: [notification] };
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
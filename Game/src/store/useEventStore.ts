import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './mmkvStorage';
import { GeneratedEvent, IEventLog } from '../types';
import { GameConstants } from '../constants/GameConstants';

interface EventState {
  logs: IEventLog[];
  addLog: (text: string, type: IEventLog['type']) => void;
  addGeneratedLog: (event: GeneratedEvent) => void;
  clearLogs: () => void;
}

const createLogId = (): string => {
  return Date.now().toString() + Math.random().toString();
};

export const useEventStore = create<EventState>()(
  persist(
    (set) => ({
      logs: [],
      addLog: (text, type) =>
        set((state) => ({
          logs: [
            {
              id: createLogId(),
              text,
              timestamp: Date.now(),
              type,
            },
            ...state.logs,
          ].slice(0, GameConstants.EVENT_MAX_LOGS),
        })),
      addGeneratedLog: (event) =>
        set((state) => ({
          logs: [
            {
              id: createLogId(),
              text: '',
              timestamp: Date.now(),
              type: event.logType,
              generated: true,
              textKey: event.textKey,
              params: event.params,
              effects: event.displayEffects,
              rarity: event.rarity,
            },
            ...state.logs,
          ].slice(0, GameConstants.EVENT_MAX_LOGS),
        })),
      clearLogs: () => set({ logs: [] }),
    }),
    {
      name: 'event-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);

export type { IEventLog };
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './mmkvStorage';
import { IEventLog } from '../types';

interface EventState {
  logs: IEventLog[];
  hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  addLog: (log: IEventLog) => void;
  clearLogs: () => void;
}

export const useEventStore = create<EventState>()(
  persist(
    (set) => ({
      logs: [],
      hasHydrated: false,
      setHasHydrated: (state) => set({ hasHydrated: state }),
      // Добавляем новые события в начало массива
      addLog: (log) => set((state) => ({ logs: [log, ...state.logs] })),
      clearLogs: () => set({ logs: [] }),
    }),
    {
      name: 'events-storage',
      storage: createJSONStorage(() => zustandStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
        }
      },
    }
  )
);
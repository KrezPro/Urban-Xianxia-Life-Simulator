import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './mmkvStorage';

export interface IEventLog {
  id: string;
  text: string;
  timestamp: number;
  type: 'mundane' | 'secret' | 'system';
}

interface EventState {
  logs: IEventLog[];
  addLog: (text: string, type: IEventLog['type']) => void;
  clearLogs: () => void;
}

export const useEventStore = create<EventState>()(
  persist(
    (set) => ({
      logs: [],
      addLog: (text, type) => set((state) => ({
        logs: [{ 
          id: Date.now().toString() + Math.random().toString(), 
          text, 
          timestamp: Date.now(), 
          type 
        }, ...state.logs]
      })),
      clearLogs: () => set({ logs: [] }),
    }),
    {
      name: 'event-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
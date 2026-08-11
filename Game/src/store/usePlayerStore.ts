import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './mmkvStorage';

interface PlayerState {
  age: number;
  qi: string; // Используем string для безопасной сериализации больших чисел (BigInt эквивалент) в MMKV
  intelligence: number;
  health: number;
  appearance: number;
  karma: number;
  spiritualRoot: number;
  cultivationStage: string;
  hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  growOlder: () => void;
  addQi: (amount: string) => void;
  resetPlayer: () => void;
}

const initialState = {
  age: 0,
  qi: "0",
  intelligence: 10,
  health: 100,
  appearance: 50,
  karma: 0,
  spiritualRoot: 10,
  cultivationStage: 'mortal',
};

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set) => ({
      ...initialState,
      hasHydrated: false,
      setHasHydrated: (state) => set({ hasHydrated: state }),
      growOlder: () => set((state) => ({ age: state.age + 1 })),
      addQi: (amount) => set((state) => {
        const current = BigInt(state.qi);
        const add = BigInt(amount);
        return { qi: (current + add).toString() };
      }),
      resetPlayer: () => set({ ...initialState }),
    }),
    {
      name: 'player-storage',
      storage: createJSONStorage(() => zustandStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
        }
      },
    }
  )
);
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './mmkvStorage';
import { IPlayer } from '../types';

interface PlayerState extends IPlayer {
  hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  incrementAge: () => void;
  addQi: (amount: string) => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      age: 0,
      health: 100,
      intellect: 10,
      charm: 10,
      money: 0,
      qi: "0", 
      spiritualRoot: "Смертный корень",
      karma: 0,
      cultivationStage: "Смертный",
      
      hasHydrated: false,
      setHasHydrated: (state) => set({ hasHydrated: state }),

      incrementAge: () => set((state) => ({ age: state.age + 1 })),
      addQi: (amount: string) => {
        const currentQi = BigInt(get().qi);
        const addAmount = BigInt(amount);
        set({ qi: (currentQi + addAmount).toString() });
      },
    }),
    {
      name: 'player-storage',
      storage: createJSONStorage(() => zustandStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
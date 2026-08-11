import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage, replacer, reviver } from './mmkvStorage';
import { IPlayer } from '../types';

interface PlayerState extends IPlayer {
  hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  growOlder: () => void;
  addQi: (amount: bigint) => void;
  addMoney: (amount: bigint) => void;
  resetPlayer: () => void;
}

const initialState: IPlayer = {
  age: 0,
  intelligence: 10,
  health: 100,
  appearance: 50,
  money: 0n,
  qi: 0n,
  karma: 0,
  spiritualRoot: 10, // Базовая скорость накопления Ци
  cultivationStage: 'mortal',
};

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set) => ({
      ...initialState,
      hasHydrated: false,
      setHasHydrated: (state) => set({ hasHydrated: state }),
      growOlder: () => set((state) => ({ age: state.age + 1 })),
      addQi: (amount) => set((state) => ({ qi: state.qi + amount })),
      addMoney: (amount) => set((state) => ({ money: state.money + amount })),
      resetPlayer: () => set({ ...initialState }),
    }),
    {
      name: 'player-storage',
      // Используем кастомный storage с поддержкой BigInt
      storage: createJSONStorage(() => zustandStorage, { replacer, reviver }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
        }
      },
    }
  )
);
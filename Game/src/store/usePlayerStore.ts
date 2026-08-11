import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './mmkvStorage';

interface PlayerEffects {
  intelligence?: number;
  health?: number;
  appearance?: number;
  karma?: number;
  money?: number;
  qi?: string;
}

interface PlayerState {
  age: number;
  qi: string; // Используем string для безопасной сериализации больших чисел (BigInt) в MMKV
  money: number;
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
  applyEffects: (effects: PlayerEffects) => void;
  resetPlayer: () => void;
}

const initialState = {
  age: 0,
  qi: "0",
  money: 0,
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
      applyEffects: (effects) => set((state) => {
        const newState: Partial<PlayerState> = {};
        if (effects.health) newState.health = Math.max(0, state.health + effects.health);
        if (effects.intelligence) newState.intelligence = state.intelligence + effects.intelligence;
        if (effects.appearance) newState.appearance = state.appearance + effects.appearance;
        if (effects.karma) newState.karma = state.karma + effects.karma;
        if (effects.money) newState.money = state.money + effects.money;
        if (effects.qi) {
          const currentQi = BigInt(state.qi);
          const addQi = BigInt(effects.qi);
          const resultQi = currentQi + addQi;
          newState.qi = resultQi < 0n ? "0" : resultQi.toString();
        }
        return newState;
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
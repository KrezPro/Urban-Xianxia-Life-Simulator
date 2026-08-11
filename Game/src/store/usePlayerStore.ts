import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './mmkvStorage';
import { GameConstants } from '../constants/GameConstants';

interface PlayerEffects {
  intelligence?: number;
  health?: number;
  appearance?: number;
  karma?: number;
  money?: number;
  qi?: string;
}

interface PlayerState {
  isDead: boolean;
  age: number;
  qi: string;
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
  reincarnate: () => void;
  resetPlayer: () => void;
}

const initialState = {
  isDead: false,
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

const getRandomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set) => ({
      ...initialState,
      hasHydrated: false,
      setHasHydrated: (state) => set({ hasHydrated: state }),
      growOlder: () => set((state) => ({ age: state.age + 1 })),
      addQi: (amount) => set((state) => {
        if (state.isDead) return state;
        const current = BigInt(state.qi);
        const add = BigInt(amount);
        return { qi: (current + add).toString() };
      }),
      applyEffects: (effects) => set((state) => {
        if (state.isDead) return state;
        
        const newState: Partial<PlayerState> = {};
        
        if (effects.health !== undefined) {
          newState.health = Math.max(0, state.health + effects.health);
          if (newState.health <= 0) {
            newState.isDead = true;
          }
        }
        if (effects.intelligence !== undefined) newState.intelligence = Math.max(0, state.intelligence + effects.intelligence);
        if (effects.appearance !== undefined) newState.appearance = Math.max(0, state.appearance + effects.appearance);
        if (effects.karma !== undefined) newState.karma = state.karma + effects.karma;
        if (effects.money !== undefined) newState.money = Math.max(0, state.money + effects.money);
        
        if (effects.qi !== undefined) {
          const currentQi = BigInt(state.qi);
          const addQi = BigInt(effects.qi);
          const resultQi = currentQi + addQi;
          // Инвертировано условие, чтобы не использовать знак меньше
          newState.qi = 0n > resultQi ? "0" : resultQi.toString();
        }
        
        return newState;
      }),
      reincarnate: () => set((state) => {
        const { STARTING_STATS } = GameConstants;
        return {
          isDead: false,
          age: 0,
          qi: "0",
          cultivationStage: 'mortal',
          karma: state.karma,
          health: getRandomInt(STARTING_STATS.HEALTH_MIN, STARTING_STATS.HEALTH_MAX),
          intelligence: getRandomInt(STARTING_STATS.INT_MIN, STARTING_STATS.INT_MAX),
          appearance: getRandomInt(STARTING_STATS.APP_MIN, STARTING_STATS.APP_MAX),
          money: getRandomInt(STARTING_STATS.MONEY_MIN, STARTING_STATS.MONEY_MAX),
          spiritualRoot: getRandomInt(STARTING_STATS.ROOT_MIN, STARTING_STATS.ROOT_MAX),
        };
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
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './mmkvStorage';
import { GameConstants } from '../constants/GameConstants';
import { useInventoryStore } from './useInventoryStore';
import itemsData from '../data/items.json';

interface PlayerEffects {
  intelligence?: number;
  health?: number;
  appearance?: number;
  karma?: number | string;
  money?: number | string;
  qi?: string;
}

interface PlayerState {
  isDead: boolean;
  age: number;
  qi: string;
  money: string;
  intelligence: number;
  health: number;
  appearance: number;
  karma: string;
  lastLifeKarmaEarned: string;
  spiritualRoot: number;
  cultivationStage: string;
  activityFocus: 'mundane' | 'secret';
  hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  setActivityFocus: (focus: 'mundane' | 'secret') => void;
  setCultivationStage: (stage: string) => void;
  growOlder: () => void;
  addQi: (amount: string) => void;
  deductQi: (amount: string) => void;
  deductKarma: (amount: string) => void;
  applyEffects: (effects: PlayerEffects) => void;
  reincarnate: () => void;
  resetPlayer: () => void;
}

const initialState = {
  isDead: false,
  age: 0,
  qi: "0",
  money: "0",
  intelligence: 10,
  health: 100,
  appearance: 50,
  karma: "0",
  lastLifeKarmaEarned: "0",
  spiritualRoot: 10,
  cultivationStage: 'mortal',
  activityFocus: 'mundane' as 'mundane' | 'secret',
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
      setActivityFocus: (focus) => set({ activityFocus: focus }),
      setCultivationStage: (stage) => set({ cultivationStage: stage }),
      growOlder: () => set((state) => ({ age: state.age + 1 })),
      addQi: (amount) => set((state) => {
        if (state.isDead) return state;
        const current = BigInt(state.qi);
        const add = BigInt(amount);
        return { qi: (current + add).toString() };
      }),
      deductQi: (amount) => set((state) => {
        if (state.isDead) return state;
        const current = BigInt(state.qi);
        const deduct = BigInt(amount);
        const result = current - deduct;
        return { qi: 0n > result ? "0" : result.toString() };
      }),
      deductKarma: (amount) => set((state) => {
        const current = BigInt(state.karma);
        const deduct = BigInt(amount);
        const result = current - deduct;
        return { karma: 0n > result ? "0" : result.toString() };
      }),
      applyEffects: (effects) => set((state) => {
        if (state.isDead) return state;
        
        const newState: Partial<PlayerState> = {};
        
        if (effects.health !== undefined) {
          newState.health = Math.max(0, state.health + effects.health);
        }
        
        if (effects.intelligence !== undefined) newState.intelligence = Math.max(0, state.intelligence + effects.intelligence);
        if (effects.appearance !== undefined) newState.appearance = Math.max(0, state.appearance + effects.appearance);
        
        if (effects.karma !== undefined) {
          const currentKarma = BigInt(state.karma);
          const addKarma = BigInt(effects.karma);
          newState.karma = (currentKarma + addKarma).toString();
        }
        
        if (effects.money !== undefined) {
          const currentMoney = BigInt(state.money);
          const addMoney = BigInt(effects.money);
          const resultMoney = currentMoney + addMoney;
          newState.money = 0n > resultMoney ? "0" : resultMoney.toString();
        }
        
        if (effects.qi !== undefined) {
          const currentQi = BigInt(state.qi);
          const addQi = BigInt(effects.qi);
          const resultQi = currentQi + addQi;
          newState.qi = 0n > resultQi ? "0" : resultQi.toString();
        }

        if (newState.health !== undefined && newState.health <= 0) {
          newState.isDead = true;
          
          const currentAge = BigInt(state.age);
          const finalMoney = BigInt(newState.money !== undefined ? newState.money : state.money);
          const finalQi = BigInt(newState.qi !== undefined ? newState.qi : state.qi);
          
          const ageKarma = currentAge * GameConstants.KARMA_RATES.AGE_MULTIPLIER;
          const moneyKarma = finalMoney / GameConstants.KARMA_RATES.MONEY_DIVISOR;
          const qiKarma = finalQi / GameConstants.KARMA_RATES.QI_DIVISOR;
          
          const earnedKarma = ageKarma + moneyKarma + qiKarma;
          newState.lastLifeKarmaEarned = earnedKarma.toString();
          
          const existingKarma = BigInt(newState.karma !== undefined ? newState.karma : state.karma);
          newState.karma = (existingKarma + earnedKarma).toString();
        }
        
        return newState;
      }),
      reincarnate: () => set((state) => {
        const { STARTING_STATS } = GameConstants;
        const inventory = useInventoryStore.getState().items;

        let bonusMoney = 0;
        let bonusHealth = 0;
        let bonusRoot = 0;

        itemsData.forEach((item: any) => {
          if (item.type === 'karma_buff' && inventory[item.id]) {
            if (item.effects.money) bonusMoney += item.effects.money;
            if (item.effects.health) bonusHealth += item.effects.health;
            if (item.effects.spiritualRoot) bonusRoot += item.effects.spiritualRoot;
          }
        });

        return {
          isDead: false,
          age: 0,
          qi: "0",
          cultivationStage: 'mortal',
          karma: state.karma,
          lastLifeKarmaEarned: "0",
          activityFocus: 'mundane',
          health: getRandomInt(STARTING_STATS.HEALTH_MIN, STARTING_STATS.HEALTH_MAX) + bonusHealth,
          intelligence: getRandomInt(STARTING_STATS.INT_MIN, STARTING_STATS.INT_MAX),
          appearance: getRandomInt(STARTING_STATS.APP_MIN, STARTING_STATS.APP_MAX),
          money: (getRandomInt(STARTING_STATS.MONEY_MIN, STARTING_STATS.MONEY_MAX) + bonusMoney).toString(),
          spiritualRoot: getRandomInt(STARTING_STATS.ROOT_MIN, STARTING_STATS.ROOT_MAX) + bonusRoot,
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
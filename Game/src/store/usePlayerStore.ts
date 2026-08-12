import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './mmkvStorage';
import { GameConstants } from '../constants/GameConstants';
import { DeathCause, RebirthReport } from '../types';
import { useInventoryStore } from './useInventoryStore';
import { useTechniquesStore } from './useTechniquesStore';
import { useLifestyleStore } from './useLifestyleStore';
import { getRandomInt, safeBigInt } from '../utils/helpers';
import { getKarmaTotalEffects } from '../utils/gameplayUtils';
import { getCurseById, rollRebirthReport } from '../utils/rebirthUtils';

interface PlayerEffects {
  intelligence?: number;
  health?: number;
  maxHealth?: number;
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
  maxHealth: number;
  appearance: number;
  karma: string;
  lastLifeKarmaEarned: string;
  spiritualRoot: number;
  cultivationStage: string;
  activityFocus: 'mundane' | 'secret';
  hasHydrated: boolean;
  hasCultivatorPass: boolean;
  lastInterstitialTime: number;
  activeCurses: string[];
  lastDeathCause: DeathCause;
  lastRebirthReport: RebirthReport | null;
  setHasHydrated: (state: boolean) => void;
  setActivityFocus: (focus: 'mundane' | 'secret') => void;
  setCultivationStage: (stage: string) => void;
  setCultivatorPass: (status: boolean) => void;
  setLastInterstitialTime: (time: number) => void;
  setDeathCause: (cause: DeathCause) => void;
  clearRebirthReport: () => void;
  normalizeHealth: () => void;
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
  qi: '0',
  money: '0',
  intelligence: 10,
  health: 100,
  maxHealth: 100,
  appearance: 50,
  karma: '0',
  lastLifeKarmaEarned: '0',
  spiritualRoot: 10,
  cultivationStage: 'mortal',
  activityFocus: 'mundane' as 'mundane' | 'secret',
  hasCultivatorPass: false,
  lastInterstitialTime: 0,
  activeCurses: [] as string[],
  lastDeathCause: 'none' as DeathCause,
  lastRebirthReport: null as RebirthReport | null,
};

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set) => ({
      ...initialState,
      hasHydrated: false,
      setHasHydrated: (state) => set({ hasHydrated: state }),
      setActivityFocus: (focus) => set({ activityFocus: focus }),
      setCultivationStage: (stage) => set({ cultivationStage: stage }),
      setCultivatorPass: (status) => set({ hasCultivatorPass: status }),
      setLastInterstitialTime: (time) => set({ lastInterstitialTime: time }),
      setDeathCause: (cause) => set({ lastDeathCause: cause }),
      clearRebirthReport: () => set({ lastRebirthReport: null }),
      normalizeHealth: () =>
        set((state) => {
          let maxHealth = state.maxHealth;
          let health = state.health;

          if (!Number.isFinite(maxHealth) || 1 > maxHealth) {
            maxHealth = Math.max(100, health, 1);
          }

          if (!Number.isFinite(health) || 0 > health) {
            health = 0;
          }

          if (health > maxHealth) {
            maxHealth = health;
          }

          return { health, maxHealth };
        }),
      growOlder: () =>
        set((state) => {
          if (state.isDead) {
            return state;
          }

          return { age: state.age + 1 };
        }),
      addQi: (amount) =>
        set((state) => {
          if (state.isDead) {
            return state;
          }

          const current = BigInt(state.qi);
          const add = BigInt(amount);
          return { qi: (current + add).toString() };
        }),
      deductQi: (amount) =>
        set((state) => {
          if (state.isDead) {
            return state;
          }

          const current = BigInt(state.qi);
          const deduct = BigInt(amount);
          const result = current - deduct;
          return { qi: 0n > result ? '0' : result.toString() };
        }),
      deductKarma: (amount) =>
        set((state) => {
          const current = BigInt(state.karma);
          const deduct = BigInt(amount);
          const result = current - deduct;
          return { karma: 0n > result ? '0' : result.toString() };
        }),
      applyEffects: (effects) =>
        set((state) => {
          if (state.isDead) {
            return state;
          }

          const newState: Partial<PlayerState> = {};

          let maxHealth = state.maxHealth;

          if (effects.maxHealth !== undefined) {
            maxHealth = Math.max(1, Math.min(GameConstants.MAX_HEALTH_CAP, maxHealth + effects.maxHealth));
          }

          let health = state.health;

          if (effects.health !== undefined) {
            health += effects.health;
          }

          health = Math.max(0, Math.min(maxHealth, health));

          newState.maxHealth = maxHealth;
          newState.health = health;

          if (effects.intelligence !== undefined) {
            newState.intelligence = Math.max(0, state.intelligence + effects.intelligence);
          }

          if (effects.appearance !== undefined) {
            newState.appearance = Math.max(0, Math.min(GameConstants.APPEARANCE_CAP, state.appearance + effects.appearance));
          }

          if (effects.karma !== undefined) {
            const currentKarma = BigInt(state.karma);
            const addKarma = BigInt(effects.karma);
            const resultKarma = currentKarma + addKarma;
            newState.karma = 0n > resultKarma ? '0' : resultKarma.toString();
          }

          if (effects.money !== undefined) {
            const currentMoney = BigInt(state.money);
            const addMoney = BigInt(effects.money);
            const resultMoney = currentMoney + addMoney;
            newState.money = 0n > resultMoney ? '0' : resultMoney.toString();
          }

          if (effects.qi !== undefined) {
            const currentQi = BigInt(state.qi);
            const addQi = BigInt(effects.qi);
            const resultQi = currentQi + addQi;
            newState.qi = 0n > resultQi ? '0' : resultQi.toString();
          }

          if (newState.health !== undefined && 0 === newState.health) {
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
      reincarnate: () => {
        const inventory = useInventoryStore.getState().items;
        const karmaEffects = getKarmaTotalEffects(inventory);

        useTechniquesStore.getState().resetTechniques();
        useLifestyleStore.getState().resetLifestyle();

        set((state) => {
          const { STARTING_STATS } = GameConstants;
          const report = rollRebirthReport(state.lastDeathCause);

          let startIntelligencePenalty = 0;
          let startAppearancePenalty = 0;

          report.curses.forEach((curseId) => {
            const curse = getCurseById(curseId);

            if (!curse) {
              return;
            }

            if (curse.startIntelligence) {
              startIntelligencePenalty += curse.startIntelligence;
            }

            if (curse.startAppearance) {
              startAppearancePenalty += curse.startAppearance;
            }
          });

          const baseHealth = getRandomInt(STARTING_STATS.HEALTH_MIN, STARTING_STATS.HEALTH_MAX);
          const totalMaxHealth = Math.min(
            GameConstants.MAX_HEALTH_CAP,
            baseHealth + karmaEffects.startMaxHealth
          );

          const currentHealth = Math.max(
            1,
            Math.floor((totalMaxHealth * report.healthStartBps) / 10000)
          );

          const baseMoney =
            BigInt(getRandomInt(STARTING_STATS.MONEY_MIN, STARTING_STATS.MONEY_MAX)) +
            safeBigInt(karmaEffects.startMoney);

          const finalMoney =
            (baseMoney * BigInt(10000 - report.moneyPenaltyBps)) / 10000n;

          return {
            isDead: false,
            age: 0,
            qi: '0',
            cultivationStage: 'mortal',
            karma: state.karma,
            lastLifeKarmaEarned: '0',
            activityFocus: 'mundane' as 'mundane' | 'secret',
            hasCultivatorPass: state.hasCultivatorPass,
            lastInterstitialTime: state.lastInterstitialTime,
            health: currentHealth,
            maxHealth: totalMaxHealth,
            intelligence: Math.max(
              1,
              getRandomInt(STARTING_STATS.INT_MIN, STARTING_STATS.INT_MAX) + startIntelligencePenalty
            ),
            appearance: Math.max(
              1,
              getRandomInt(STARTING_STATS.APP_MIN, STARTING_STATS.APP_MAX) + startAppearancePenalty
            ),
            money: finalMoney.toString(),
            spiritualRoot:
              getRandomInt(STARTING_STATS.ROOT_MIN, STARTING_STATS.ROOT_MAX) +
              karmaEffects.startSpiritualRoot,
            activeCurses: report.curses,
            lastDeathCause: 'none',
            lastRebirthReport: report,
          };
        });
      },
      resetPlayer: () => set({ ...initialState }),
    }),
    {
      name: 'player-storage',
      storage: createJSONStorage(() => zustandStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
          state.normalizeHealth();
        }
      },
    }
  )
);
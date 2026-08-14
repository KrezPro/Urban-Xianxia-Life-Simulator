import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './mmkvStorage';
import { GameConstants } from '../constants/GameConstants';
import { DeathCause, RebirthReport } from '../types';
import { useInventoryStore } from './useInventoryStore';
import { useTechniquesStore } from './useTechniquesStore';
import { useLifestyleStore } from './useLifestyleStore';
import { getRandomInt, safeBigInt } from '../utils/helpers';
import {
  getBodyTemperCost,
  getBodyTemperMoneyCost,
  getKarmaTotalEffects,
} from '../utils/gameplayUtils';
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
  interstitialShownThisLife: boolean;
  bodyTempering: number;
  lastBodyTemperAge: number;
  activeCurses: string[];
  lastDeathCause: DeathCause;
  lastRebirthReport: RebirthReport | null;
  portalBlessingBps: number;
  // Реклама после смерти
  totalDeaths: number;
  deathAdShownForDeath: number;
  setHasHydrated: (state: boolean) => void;
  setActivityFocus: (focus: 'mundane' | 'secret') => void;
  setCultivationStage: (stage: string) => void;
  setCultivatorPass: (status: boolean) => void;
  setLastInterstitialTime: (time: number) => void;
  setInterstitialShownThisLife: (status: boolean) => void;
  setDeathCause: (cause: DeathCause) => void;
  clearRebirthReport: () => void;
  normalizeHealth: () => void;
  growOlder: () => void;
  addQi: (amount: string) => void;
  deductQi: (amount: string) => void;
  deductKarma: (amount: string) => void;
  applyEffects: (effects: PlayerEffects) => void;
  temperBody: () => boolean;
  reincarnate: () => void;
  resetPlayer: () => void;
  addPortalBlessing: (bps: number) => void;
  consumePortalBlessing: () => number;
  // Реклама
  setDeathAdShownForDeath: (deathCount: number) => void;
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
  interstitialShownThisLife: false,
  bodyTempering: 0,
  lastBodyTemperAge: -1,
  activeCurses: [] as string[],
  lastDeathCause: 'none' as DeathCause,
  lastRebirthReport: null as RebirthReport | null,
  portalBlessingBps: 0,
  totalDeaths: 0,
  deathAdShownForDeath: 0,
};

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      ...initialState,
      hasHydrated: false,
      setHasHydrated: (state) => set({ hasHydrated: state }),
      setActivityFocus: (focus) => set({ activityFocus: focus }),
      setCultivationStage: (stage) => set({ cultivationStage: stage }),
      setCultivatorPass: (status) => set({ hasCultivatorPass: status }),
      setLastInterstitialTime: (time) => set({ lastInterstitialTime: time }),
      setInterstitialShownThisLife: (status) => set({ interstitialShownThisLife: status }),
      setDeathCause: (cause) => set({ lastDeathCause: cause }),
      clearRebirthReport: () => set({ lastRebirthReport: null }),
      setDeathAdShownForDeath: (deathCount) => set({ deathAdShownForDeath: deathCount }),
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
          const curses = Array.isArray(state.activeCurses) ? state.activeCurses : [];
          const deathCause = state.lastDeathCause || 'none';
          const bodyTempering = Number.isFinite(state.bodyTempering) ? state.bodyTempering : 0;
          const lastBodyTemperAge = Number.isFinite(state.lastBodyTemperAge)
            ? state.lastBodyTemperAge
            : -1;
          const interstitialShownThisLife = !!state.interstitialShownThisLife;
          const portalBlessingBps = Number.isFinite(state.portalBlessingBps)
            ? Math.max(0, Math.floor(state.portalBlessingBps))
            : 0;
          const totalDeaths = Number.isFinite(state.totalDeaths) ? state.totalDeaths : 0;
          const deathAdShownForDeath = Number.isFinite(state.deathAdShownForDeath)
            ? state.deathAdShownForDeath
            : 0;
          return {
            health,
            maxHealth,
            activeCurses: curses,
            lastDeathCause: deathCause,
            bodyTempering,
            lastBodyTemperAge,
            interstitialShownThisLife,
            portalBlessingBps,
            totalDeaths,
            deathAdShownForDeath,
          };
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
          const current = safeBigInt(state.qi);
          const add = safeBigInt(amount);
          return { qi: (current + add).toString() };
        }),
      deductQi: (amount) =>
        set((state) => {
          if (state.isDead) {
            return state;
          }
          const current = safeBigInt(state.qi);
          const deduct = safeBigInt(amount);
          const safeDeduct = deduct > 0n ? deduct : 0n;
          const result = current - safeDeduct;
          return { qi: 0n > result ? '0' : result.toString() };
        }),
      deductKarma: (amount) =>
        set((state) => {
          const current = safeBigInt(state.karma);
          const deduct = safeBigInt(amount);
          const safeDeduct = deduct > 0n ? deduct : 0n;
          const result = current - safeDeduct;
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
            maxHealth = Math.max(
              1,
              Math.min(GameConstants.MAX_HEALTH_CAP, maxHealth + effects.maxHealth)
            );
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
            newState.appearance = Math.max(
              0,
              Math.min(GameConstants.APPEARANCE_CAP, state.appearance + effects.appearance)
            );
          }
          if (effects.karma !== undefined) {
            const currentKarma = safeBigInt(state.karma);
            const addKarma = safeBigInt(effects.karma);
            const resultKarma = currentKarma + addKarma;
            newState.karma = 0n > resultKarma ? '0' : resultKarma.toString();
          }
          if (effects.money !== undefined) {
            const currentMoney = safeBigInt(state.money);
            const addMoney = safeBigInt(effects.money);
            const resultMoney = currentMoney + addMoney;
            newState.money = 0n > resultMoney ? '0' : resultMoney.toString();
          }
          if (effects.qi !== undefined) {
            const currentQi = safeBigInt(state.qi);
            const addQi = safeBigInt(effects.qi);
            const resultQi = currentQi + addQi;
            newState.qi = 0n > resultQi ? '0' : resultQi.toString();
          }
          if (newState.health !== undefined && 0 === newState.health) {
            newState.isDead = true;
            // Инкремент totalDeaths при первой смерти (один раз)
            newState.totalDeaths = state.totalDeaths + 1;
            const currentAge = safeBigInt(state.age);
            const finalMoney = safeBigInt(
              newState.money !== undefined ? newState.money : state.money
            );
            const finalQi = safeBigInt(newState.qi !== undefined ? newState.qi : state.qi);
            const ageKarma = currentAge * GameConstants.KARMA_RATES.AGE_MULTIPLIER;
            const moneyKarma = finalMoney / GameConstants.KARMA_RATES.MONEY_DIVISOR;
            const qiKarma = finalQi / GameConstants.KARMA_RATES.QI_DIVISOR;
            const earnedKarma = ageKarma + moneyKarma + qiKarma;
            newState.lastLifeKarmaEarned = earnedKarma.toString();
            const existingKarma = safeBigInt(
              newState.karma !== undefined ? newState.karma : state.karma
            );
            newState.karma = (existingKarma + earnedKarma).toString();
          }
          return newState;
        }),
      temperBody: () => {
        const state = get();
        if (state.isDead) {
          return false;
        }
        if (state.age < GameConstants.BODY_TEMPERING.MIN_AGE) {
          return false;
        }
        if (state.lastBodyTemperAge === state.age) {
          return false;
        }
        const cost = getBodyTemperCost(state.bodyTempering);
        const moneyCost = getBodyTemperMoneyCost(state.bodyTempering);
        const currentQi = safeBigInt(state.qi);
        const currentMoney = safeBigInt(state.money);
        if (currentQi < cost) {
          return false;
        }
        if (currentMoney < moneyCost) {
          return false;
        }
        const nextBodyTempering = state.bodyTempering + 1;
        set({
          qi: (currentQi - cost).toString(),
          money: (currentMoney - moneyCost).toString(),
          bodyTempering: nextBodyTempering,
          lastBodyTemperAge: state.age,
        });
        get().applyEffects({
          maxHealth: GameConstants.BODY_TEMPERING.MAX_HEALTH_PER_LEVEL,
          health: 2,
        });
        return true;
      },
      reincarnate: () => {
        const inventory = useInventoryStore.getState().items;
        const karmaEffects = getKarmaTotalEffects(inventory);
        useTechniquesStore.getState().resetTechniques();
        useLifestyleStore.getState().resetLifestyle();
        set((state) => {
          const { STARTING_STATS } = GameConstants;
          const report = rollRebirthReport(state.lastDeathCause || 'none');
          let startIntelligencePenalty = 0;
          let startAppearancePenalty = 0;
          (report.curses || []).forEach((curseId) => {
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
          const startBodyTempering = karmaEffects.startBodyTempering || 0;
          const bodyMaxHealth =
            startBodyTempering * GameConstants.BODY_TEMPERING.MAX_HEALTH_PER_LEVEL;
          const baseHealth = getRandomInt(STARTING_STATS.HEALTH_MIN, STARTING_STATS.HEALTH_MAX);
          const totalMaxHealth = Math.min(
            GameConstants.MAX_HEALTH_CAP,
            baseHealth + karmaEffects.startMaxHealth + bodyMaxHealth
          );
          const currentHealth = Math.max(
            1,
            Math.floor((totalMaxHealth * report.healthStartBps) / 10000)
          );
          const baseMoney =
            BigInt(getRandomInt(STARTING_STATS.MONEY_MIN, STARTING_STATS.MONEY_MAX)) +
            safeBigInt(karmaEffects.startMoney);
          const finalMoney = (baseMoney * BigInt(10000 - report.moneyPenaltyBps)) / 10000n;
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
            interstitialShownThisLife: false,
            bodyTempering: startBodyTempering,
            lastBodyTemperAge: -1,
            health: currentHealth,
            maxHealth: totalMaxHealth,
            intelligence: Math.max(
              1,
              getRandomInt(STARTING_STATS.INT_MIN, STARTING_STATS.INT_MAX) +
                startIntelligencePenalty
            ),
            appearance: Math.max(
              1,
              getRandomInt(STARTING_STATS.APP_MIN, STARTING_STATS.APP_MAX) +
                startAppearancePenalty
            ),
            money: finalMoney.toString(),
            spiritualRoot:
              getRandomInt(STARTING_STATS.ROOT_MIN, STARTING_STATS.ROOT_MAX) +
              karmaEffects.startSpiritualRoot,
            activeCurses: report.curses || [],
            lastDeathCause: 'none',
            lastRebirthReport: report,
            portalBlessingBps: 0,
            // totalDeaths НЕ сбрасывается при реинкарнации
            totalDeaths: state.totalDeaths,
            deathAdShownForDeath: state.deathAdShownForDeath,
          };
        });
      },
      resetPlayer: () => set({ ...initialState }),
      addPortalBlessing: (bps) =>
        set((state) => {
          const add = Number.isFinite(bps) && bps > 0 ? Math.floor(bps) : 0;
          if (add <= 0) {
            return state;
          }
          const next = Math.min(
            GameConstants.PORTAL_BLESSING_CAP_BPS,
            state.portalBlessingBps + add
          );
          return { portalBlessingBps: next };
        }),
      consumePortalBlessing: () => {
        const consumed = get().portalBlessingBps || 0;
        if (consumed > 0) {
          set({ portalBlessingBps: 0 });
        }
        return consumed;
      },
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
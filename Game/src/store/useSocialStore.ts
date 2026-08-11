import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './mmkvStorage';
import { ILeaderboardEntry, ISect } from '../types';
import { generateInviteCode, isValidInviteCode, normalizeInviteCode } from '../services/inviteCodeService';
import { createNpcSectFromCode, createPlayerSect, simulateNpcProgress } from '../services/socialService';
import { buildLeaderboard } from '../services/leaderboardService';
import { addBigIntStrings, divideBigIntStringByNumber, safeBigInt } from '../utils/bigIntUtils';
import { GameConstants } from '../constants/GameConstants';
import { usePlayerStore } from './usePlayerStore';

type ContributeResult = 'ok' | 'no_money' | 'no_sect';

interface SocialState {
  hasHydrated: boolean;
  sect: ISect | null;
  inviteCode: string;
  leaderboard: ILeaderboardEntry[];
  lastOfflineSimulationAt: number;
  setHasHydrated: (state: boolean) => void;
  createSect: (name: string, tag: string, seasonId: string) => void;
  joinSectByInvite: (code: string, seasonId: string) => boolean;
  leaveSect: () => void;
  contribute: (amount: string) => ContributeResult;
  simulateOffline: (now: number) => void;
  refreshLeaderboard: () => void;
}

export const useSocialStore = create<SocialState>()(
  persist(
    (set, get) => ({
      hasHydrated: false,
      sect: null,
      inviteCode: '',
      leaderboard: [],
      lastOfflineSimulationAt: Date.now(),
      setHasHydrated: (state) => set({ hasHydrated: state }),

      createSect: (name, tag, seasonId) => {
        const inviteCode = generateInviteCode();
        const sect = createPlayerSect({ name, tag, inviteCode, seasonId });

        set({
          sect,
          inviteCode,
          leaderboard: buildLeaderboard(sect),
          lastOfflineSimulationAt: Date.now(),
        });
      },

      joinSectByInvite: (code, seasonId) => {
        const normalized = normalizeInviteCode(code);

        if (!isValidInviteCode(normalized)) {
          return false;
        }

        const sect = createNpcSectFromCode(normalized, seasonId);

        set({
          sect,
          inviteCode: normalized,
          leaderboard: buildLeaderboard(sect),
          lastOfflineSimulationAt: Date.now(),
        });

        return true;
      },

      leaveSect: () => {
        set({
          sect: null,
          inviteCode: '',
          leaderboard: buildLeaderboard(null),
          lastOfflineSimulationAt: Date.now(),
        });
      },

      contribute: (amount) => {
        const state = get();

        if (!state.sect) {
          return 'no_sect';
        }

        const playerStore = usePlayerStore.getState();
        const amountBig = safeBigInt(amount);
        const moneyBig = safeBigInt(playerStore.money);

        if (amountBig > moneyBig) {
          return 'no_money';
        }

        playerStore.applyEffects({ money: `-${amount}` });

        const influenceGain = divideBigIntStringByNumber(amount, 100);

        const updatedSect: ISect = {
          ...state.sect,
          funds: addBigIntStrings(state.sect.funds, amount),
          influence: addBigIntStrings(state.sect.influence, influenceGain),
          members: state.sect.members.map((member) => {
            if (member.id !== 'player') {
              return member;
            }

            return {
              ...member,
              contribution: addBigIntStrings(member.contribution, amount),
              influence: addBigIntStrings(member.influence, influenceGain),
            };
          }),
        };

        set({
          sect: updatedSect,
          leaderboard: buildLeaderboard(updatedSect),
        });

        return 'ok';
      },

      simulateOffline: (now) => {
        const state = get();

        if (!state.sect) {
          return;
        }

        const elapsedMs = now - state.lastOfflineSimulationAt;

        if (0 >= elapsedMs) {
          return;
        }

        const maxMs = GameConstants.SOCIAL_MAX_OFFLINE_SECONDS * 1000;
        const cappedMs = Math.min(elapsedMs, maxMs);
        const elapsedSeconds = Math.floor(cappedMs / 1000);

        if (elapsedSeconds > 60) {
          const updatedSect = simulateNpcProgress(state.sect, elapsedSeconds);

          set({
            sect: updatedSect,
            leaderboard: buildLeaderboard(updatedSect),
            lastOfflineSimulationAt: now,
          });

          return;
        }

        set({
          lastOfflineSimulationAt: now,
        });
      },

      refreshLeaderboard: () => {
        set({
          leaderboard: buildLeaderboard(get().sect),
        });
      },
    }),
    {
      name: 'social-storage',
      storage: createJSONStorage(() => zustandStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
        }
      },
    }
  )
);
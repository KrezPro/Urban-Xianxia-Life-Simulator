import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './mmkvStorage';
import { ILeaderboardEntry, ISect } from '../types';
import {
  buildLeaderboard,
  createNpcSectFromCode,
  createPlayerSect,
  getCurrentSeasonId,
  generateInviteCode,
  isValidInviteCode,
  normalizeInviteCode,
  simulateNpcProgress,
} from '../services/socialService';
import {
  addBigIntStrings,
  divideBigIntStringByNumber,
} from '../utils/helpers';
import { GameConstants } from '../constants/GameConstants';

type ContributeResult = 'ok' | 'no_sect';

interface SocialState {
  hasHydrated: boolean;
  sect: ISect | null;
  inviteCode: string;
  leaderboard: ILeaderboardEntry[];
  seasonId: string;
  lastOfflineSimulationAt: number;
  setHasHydrated: (state: boolean) => void;
  createSect: (name: string, tag: string) => void;
  joinSectByInvite: (code: string) => boolean;
  leaveSect: () => void;
  registerDonation: (amount: string) => ContributeResult;
  simulateOffline: (now: number) => void;
  refreshLeaderboard: () => void;
}

export const useSocialStore = create<SocialState>()(
  persist(
    (set, get) => ({
      hasHydrated: false,
      sect: null,
      inviteCode: '',
      leaderboard: buildLeaderboard(null),
      seasonId: getCurrentSeasonId(),
      lastOfflineSimulationAt: Date.now(),

      setHasHydrated: (state) => set({ hasHydrated: state }),

      createSect: (name, tag) => {
        const seasonId = getCurrentSeasonId();
        const inviteCode = generateInviteCode();
        const sect = createPlayerSect({ name, tag, inviteCode, seasonId });

        set({
          sect,
          inviteCode,
          seasonId,
          leaderboard: buildLeaderboard(sect),
          lastOfflineSimulationAt: Date.now(),
        });
      },

      joinSectByInvite: (code) => {
        const normalized = normalizeInviteCode(code);

        if (!isValidInviteCode(normalized)) {
          return false;
        }

        const seasonId = getCurrentSeasonId();
        const sect = createNpcSectFromCode(normalized, seasonId);

        set({
          sect,
          inviteCode: normalized,
          seasonId,
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

      registerDonation: (amount) => {
        const state = get();

        if (!state.sect) {
          return 'no_sect';
        }

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
        const currentSeasonId = getCurrentSeasonId();

        if (state.seasonId !== currentSeasonId) {
          set({
            seasonId: currentSeasonId,
            leaderboard: buildLeaderboard(state.sect),
          });
        }

        if (!state.sect) {
          set({ lastOfflineSimulationAt: now });
          return;
        }

        if (state.lastOfflineSimulationAt >= now) {
          return;
        }

        const elapsedMs = now - state.lastOfflineSimulationAt;
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

        set({ lastOfflineSimulationAt: now });
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
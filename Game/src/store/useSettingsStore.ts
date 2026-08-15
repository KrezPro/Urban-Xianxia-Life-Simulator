import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './mmkvStorage';

export type MusicStyle = 'calm' | 'mystic' | 'energetic';

const isMusicStyle = (value: unknown): value is MusicStyle =>
  value === 'calm' || value === 'mystic' || value === 'energetic';

interface SettingsState {
  soundEnabled: boolean;
  musicEnabled: boolean;
  musicSeed: number;
  musicStyle: MusicStyle;
  hasHydrated: boolean;
  setSoundEnabled: (value: boolean) => void;
  setMusicEnabled: (value: boolean) => void;
  setMusicSeed: (value: number) => void;
  setMusicStyle: (value: MusicStyle) => void;
  setHasHydrated: (value: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      soundEnabled: true,
      musicEnabled: true,
      musicSeed: 7,
      musicStyle: 'calm',
      hasHydrated: false,
      setSoundEnabled: (value) => set({ soundEnabled: value }),
      setMusicEnabled: (value) => set({ musicEnabled: value }),
      setMusicSeed: (value) => set({ musicSeed: Math.max(1, Math.floor(value)) }),
      setMusicStyle: (value) => set({ musicStyle: value }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => zustandStorage),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<SettingsState> | undefined;
        if (!persisted) {
          return currentState;
        }
        return {
          ...currentState,
          ...persisted,
          musicStyle: isMusicStyle(persisted.musicStyle) ? persisted.musicStyle : 'calm',
          musicSeed:
            typeof persisted.musicSeed === 'number' && Number.isFinite(persisted.musicSeed)
              ? Math.max(1, Math.floor(persisted.musicSeed))
              : 7,
          hasHydrated: currentState.hasHydrated,
        };
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
        }
      },
    }
  )
);
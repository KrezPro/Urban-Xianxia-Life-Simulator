import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './mmkvStorage';

interface SettingsState {
  soundEnabled: boolean;
  musicEnabled: boolean;
  hasHydrated: boolean;
  setSoundEnabled: (value: boolean) => void;
  setMusicEnabled: (value: boolean) => void;
  setHasHydrated: (value: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      soundEnabled: true,
      musicEnabled: true,
      hasHydrated: false,
      setSoundEnabled: (value) => set({ soundEnabled: value }),
      setMusicEnabled: (value) => set({ musicEnabled: value }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => zustandStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
        }
      },
    }
  )
);
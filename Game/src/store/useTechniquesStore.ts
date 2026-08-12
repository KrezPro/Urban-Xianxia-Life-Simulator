import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './mmkvStorage';

interface TechniquesState {
  levels: Record<string, number>;
  hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  incrementTechnique: (id: string) => void;
  resetTechniques: () => void;
}

export const useTechniquesStore = create<TechniquesState>()(
  persist(
    (set) => ({
      levels: {},
      hasHydrated: false,
      setHasHydrated: (state) => set({ hasHydrated: state }),
      incrementTechnique: (id) =>
        set((state) => {
          const currentLevel = state.levels?.[id] || 0;

          return {
            levels: {
              ...(state.levels || {}),
              [id]: currentLevel + 1,
            },
          };
        }),
      resetTechniques: () => set({ levels: {} }),
    }),
    {
      name: 'techniques-storage',
      storage: createJSONStorage(() => zustandStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (!state.levels || typeof state.levels !== 'object') {
            state.levels = {};
          }
          state.setHasHydrated(true);
        }
      },
    }
  )
);
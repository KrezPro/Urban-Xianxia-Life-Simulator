import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './mmkvStorage';
import { LifestyleCategory, LifestyleSelection } from '../types';

interface LifestyleState {
  selected: LifestyleSelection;
  hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  selectOption: (category: LifestyleCategory, optionId: string) => void;
  disableOption: (category: LifestyleCategory) => void;
  resetLifestyle: () => void;
}

const defaultSelection: LifestyleSelection = {
  job: 'job_none',
  sport: 'sport_none',
  food: 'food_none',
  housing: 'housing_none',
  portal: 'portal_none',
};

export const useLifestyleStore = create<LifestyleState>()(
  persist(
    (set) => ({
      selected: { ...defaultSelection },
      hasHydrated: false,
      setHasHydrated: (state) => set({ hasHydrated: state }),
      selectOption: (category, optionId) =>
        set((state) => ({
          selected: {
            ...state.selected,
            [category]: optionId,
          },
        })),
      disableOption: (category) =>
        set((state) => ({
          selected: {
            ...state.selected,
            [category]: `${category}_none`,
          },
        })),
      resetLifestyle: () => set({ selected: { ...defaultSelection } }),
    }),
    {
      name: 'lifestyle-storage',
      storage: createJSONStorage(() => zustandStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
        }
      },
    }
  )
);
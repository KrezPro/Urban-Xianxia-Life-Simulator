import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './mmkvStorage';
import { Locale } from '../types';
import { DEFAULT_LOCALE, isLocale } from '../constants/Locales';

interface LocaleState {
  locale: Locale;
  hasHydrated: boolean;
  hasChosenLanguage: boolean;
  setLocale: (locale: Locale) => void;
  setHasHydrated: (state: boolean) => void;
  setHasChosenLanguage: (value: boolean) => void;
  setLocaleAndMarkChosen: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: DEFAULT_LOCALE,
      hasHydrated: false,
      hasChosenLanguage: false,
      setLocale: (locale) => set({ locale }),
      setHasHydrated: (state) => set({ hasHydrated: state }),
      setHasChosenLanguage: (value) => set({ hasChosenLanguage: value }),
      setLocaleAndMarkChosen: (locale) => set({ locale, hasChosenLanguage: true }),
    }),
    {
      name: 'locale-storage',
      storage: createJSONStorage(() => zustandStorage),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<LocaleState> | undefined;
        if (!persisted) {
          return currentState;
        }
        const nextLocale = isLocale(persisted.locale) ? persisted.locale : DEFAULT_LOCALE;
        const nextHasChosenLanguage =
          typeof persisted.hasChosenLanguage === 'boolean' ? persisted.hasChosenLanguage : false;
        return {
          ...currentState,
          ...persisted,
          locale: nextLocale,
          hasChosenLanguage: nextHasChosenLanguage,
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
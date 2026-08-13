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
  setLocaleAndMarkChosen: (locale: Locale) => void;
  toggleLocale: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: DEFAULT_LOCALE,
      hasHydrated: false,
      hasChosenLanguage: false,
      setLocale: (locale) => set({ locale }),
      setLocaleAndMarkChosen: (locale) => set({ locale, hasChosenLanguage: true }),
      toggleLocale: () =>
        set((state) => ({
          locale: state.locale === 'ru' ? DEFAULT_LOCALE : 'ru',
        })),
      setHasHydrated: (state) => set({ hasHydrated: state }),
    }),
    {
      name: 'locale-storage',
      storage: createJSONStorage(() => zustandStorage),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<LocaleState> | undefined;
        if (!persisted) {
          return currentState;
        }

        const nextLocale = isLocale(persisted.locale) ? persisted.locale : currentState.locale;
        const hasChosenLanguage =
          typeof persisted.hasChosenLanguage === 'boolean'
            ? persisted.hasChosenLanguage
            : Boolean(persisted.locale);

        return {
          ...currentState,
          ...persisted,
          locale: nextLocale,
          hasChosenLanguage,
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
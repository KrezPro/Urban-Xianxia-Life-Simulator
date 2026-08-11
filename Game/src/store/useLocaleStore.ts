import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './mmkvStorage';

interface LocaleState {
  locale: 'ru' | 'en';
  setLocale: (locale: 'ru' | 'en') => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: 'ru',
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: 'locale-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
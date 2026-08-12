import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './mmkvStorage';
import { IItem } from '../types';

interface InventoryState {
  items: Record<string, IItem>;
  hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  addItem: (item: IItem) => void;
  useItem: (id: string) => void;
  clearInventory: () => void;
}

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set) => ({
      items: {},
      hasHydrated: false,
      setHasHydrated: (state) => set({ hasHydrated: state }),
      addItem: (item) =>
        set((state) => {
          const existing = state.items?.[item.id];
          const currentItems = state.items || {};

          return {
            items: {
              ...currentItems,
              [item.id]: existing
                ? { ...existing, quantity: existing.quantity + item.quantity }
                : item,
            },
          };
        }),
      useItem: (id) =>
        set((state) => {
          const currentItems = state.items || {};
          const existing = currentItems[id];

          if (!existing || 0 >= existing.quantity) {
            return state;
          }

          const newQuantity = existing.quantity - 1;
          const newItems = { ...currentItems };

          if (0 >= newQuantity) {
            delete newItems[id];
          } else {
            newItems[id] = { ...existing, quantity: newQuantity };
          }

          return { items: newItems };
        }),
      clearInventory: () => set({ items: {} }),
    }),
    {
      name: 'inventory-storage',
      storage: createJSONStorage(() => zustandStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (!state.items || typeof state.items !== 'object') {
            state.items = {};
          }
          state.setHasHydrated(true);
        }
      },
    }
  )
);
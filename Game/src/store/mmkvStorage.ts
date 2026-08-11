import { MMKV } from 'react-native-mmkv';
import { StateStorage } from 'zustand/middleware';

// Инициализируем инстанс MMKV
export const storage = new MMKV({
  id: 'bitcultivator-storage',
});

// Создаем адаптер для Zustand
export const zustandStorage: StateStorage = {
  setItem: (name, value) => {
    return storage.set(name, value);
  },
  getItem: (name) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  removeItem: (name) => {
    return storage.delete(name);
  },
};
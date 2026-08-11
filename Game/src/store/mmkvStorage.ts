import { MMKV } from 'react-native-mmkv';
import { StateStorage } from 'zustand/middleware';

// Безопасная инициализация MMKV с обработкой ошибок времени выполнения
let storageInstance: MMKV | null = null;

try {
  storageInstance = new MMKV({
    id: 'bitcultivator-storage',
  });
} catch (e) {
  console.warn('MMKV initialization failed, fallback storage used', e);
}

export const storage = {
  set: (key: string, value: string) => {
    if (storageInstance) {
      storageInstance.set(key, value);
    }
  },
  getString: (key: string) => {
    if (storageInstance) {
      return storageInstance.getString(key);
    }
    return undefined;
  },
  delete: (key: string) => {
    if (storageInstance) {
      storageInstance.delete(key);
    }
  },
};

// Адаптер для Zustand
export const zustandStorage: StateStorage = {
  setItem: (name, value) => {
    storage.set(name, value);
  },
  getItem: (name) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  removeItem: (name) => {
    storage.delete(name);
  },
};
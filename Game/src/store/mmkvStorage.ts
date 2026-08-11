import { StateStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

let nativeStorage: MMKV | null = null;

try {
  nativeStorage = new MMKV({
    id: 'bitcultivator-storage',
  });
} catch {
  nativeStorage = null;
}

const memoryMap = new Map<string, string>();

export const storage = {
  set: (key: string, value: string) => {
    if (nativeStorage) {
      nativeStorage.set(key, value);
      return;
    }

    memoryMap.set(key, value);
  },
  getString: (key: string): string | undefined => {
    if (nativeStorage) {
      return nativeStorage.getString(key);
    }

    return memoryMap.get(key);
  },
  delete: (key: string) => {
    if (nativeStorage) {
      nativeStorage.delete(key);
      return;
    }

    memoryMap.delete(key);
  },
};

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
import { StateStorage } from 'zustand/middleware';

// Ультра-безопасное хранилище на базе обычного localStorage/InMemory мока для отладки без нативных сбоев MMKV
const memoryMap = new Map<string, string>();

export const storage = {
  set: (key: string, value: string) => {
    memoryMap.set(key, value);
  },
  getString: (key: string) => {
    return memoryMap.get(key);
  },
  delete: (key: string) => {
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
import { StateStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

// Синхронный self-test нативного MMKV: если нативка отсутствует или сломана,
// запись/чтение пробного ключа бросит исключение или вернёт undefined,
// и мы детерминированно уходим в memory-fallback без тихой деградации.
let nativeStorage: MMKV | null = null;

try {
  const candidate = new MMKV({
    id: 'bitcultivator-storage',
  });
  const probeKey = '__mmkv_probe__';
  candidate.set(probeKey, '1');
  const probe = candidate.getString(probeKey);
  candidate.delete(probeKey);
  if (probe === '1') {
    nativeStorage = candidate;
  } else {
    nativeStorage = null;
  }
} catch {
  nativeStorage = null;
}

const memoryMap = new Map<string, string>();

export const getStorageBackend = (): 'mmkv' | 'memory' =>
  nativeStorage !== null ? 'mmkv' : 'memory';

export const isNativeStorageAvailable = (): boolean => nativeStorage !== null;

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
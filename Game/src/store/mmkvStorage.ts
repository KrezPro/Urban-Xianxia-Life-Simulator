import { Platform } from 'react-native';
import { StateStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

// Guarded require для expo-constants (отпечаток окружения в диагностике).
declare const require: (moduleId: string) => any;

// Отпечаток окружения: позволяет по одному скриншоту понять, ГДЕ реально
// выполняется JS (нативный билд / Expo Go / web) и есть ли JSI-хуки.
const getEnvInfo = () => {
  let execEnv = 'unknown';
  try {
    const ConstantsModule = require('expo-constants');
    execEnv =
      ConstantsModule?.default?.executionEnvironment ||
      ConstantsModule?.executionEnvironment ||
      'unknown';
  } catch {
    execEnv = 'require-failed';
  }
  const g: any = globalThis as any;
  return {
    platform: Platform.OS,
    execEnv,
    syncHook: typeof g.nativeCallSyncHook !== 'undefined',
    bridgeless: typeof g.RN$Bridgeless !== 'undefined' ? Boolean(g.RN$Bridgeless) : false,
  };
};

// Трёхуровневое СИНХРОННОЕ хранилище (урок DataForAI 25):
// 1) react-native-mmkv (основное по правилам архитектуры) с probe-тестом;
// 2) expo-kv-store — официальный синхронный KV-стор Expo (страховка под
//    SDK 54, где Nitro/MMKV-рантайм может быть несовместим с bridgeless);
// 3) memory-fallback только как аварийная среда.
// Каждый уровень проверяется probe-ключом (set/get/delete) до активации.
interface SyncBackend {
  name: 'mmkv' | 'kvstore' | 'memory';
  set: (key: string, value: string) => void;
  getString: (key: string) => string | undefined;
  delete: (key: string) => void;
}

const backendErrors: string[] = [];

const memoryMap = new Map<string, string>();
const memoryBackend: SyncBackend = {
  name: 'memory',
  set: (key, value) => {
    memoryMap.set(key, value);
  },
  getString: (key) => memoryMap.get(key),
  delete: (key) => {
    memoryMap.delete(key);
  },
};

const createMmkvBackend = (): SyncBackend | null => {
  try {
    const candidate = new MMKV({
      id: 'bitcultivator-storage',
    });
    const probeKey = '__mmkv_probe__';
    candidate.set(probeKey, '1');
    const probe = candidate.getString(probeKey);
    candidate.delete(probeKey);
    if (probe === '1') {
      return {
        name: 'mmkv',
        set: (key, value) => {
          candidate.set(key, value);
        },
        getString: (key) => candidate.getString(key),
        delete: (key) => {
          candidate.delete(key);
        },
      };
    }
    backendErrors.push('mmkv: probe read/write failed');
  } catch (error: any) {
    backendErrors.push(`mmkv: ${String(error?.message || error || 'unknown')}`);
  }
  return null;
};

const createKvStoreBackend = (): SyncBackend | null => {
  try {
    const mod = require('expo-kv-store');
    const createStore = mod?.createStore || mod?.default?.createStore;
    if (typeof createStore !== 'function') {
      backendErrors.push('kvstore: createStore not found');
      return null;
    }
    const store = createStore('bitcultivator-storage');
    const removeFn: (key: string) => void =
      typeof store.remove === 'function'
        ? (key) => store.remove(key)
        : typeof store.delete === 'function'
        ? (key) => store.delete(key)
        : () => undefined;
    const probeKey = '__kv_probe__';
    store.set(probeKey, '1');
    const probeRaw = store.get(probeKey);
    removeFn(probeKey);
    if (probeRaw === '1') {
      return {
        name: 'kvstore',
        set: (key, value) => {
          store.set(key, value);
        },
        getString: (key) => {
          const value = store.get(key);
          if (typeof value === 'string') {
            return value;
          }
          return value == null ? undefined : String(value);
        },
        delete: (key) => {
          removeFn(key);
        },
      };
    }
    backendErrors.push('kvstore: probe read/write failed');
  } catch (error: any) {
    backendErrors.push(`kvstore: ${String(error?.message || error || 'unknown')}`);
  }
  return null;
};

const activeBackend: SyncBackend =
  createMmkvBackend() || createKvStoreBackend() || memoryBackend;

export interface StorageDebugInfo {
  backend: 'mmkv' | 'kvstore' | 'memory';
  errors: string[];
  env: {
    platform: string;
    execEnv: string;
    syncHook: boolean;
    bridgeless: boolean;
  };
}

export const getStorageDebugInfo = (): StorageDebugInfo => ({
  backend: activeBackend.name,
  errors: backendErrors,
  env: getEnvInfo(),
});

export const isNativeStorageAvailable = (): boolean => activeBackend.name !== 'memory';

export const storage = {
  set: (key: string, value: string) => {
    activeBackend.set(key, value);
  },
  getString: (key: string): string | undefined => {
    return activeBackend.getString(key);
  },
  delete: (key: string) => {
    activeBackend.delete(key);
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
import { Platform } from 'react-native';
import { StateStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

declare const require: (moduleId: string) => any;

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
    bridgeless:
      typeof g.RN$Bridgeless !== 'undefined' ? Boolean(g.RN$Bridgeless) : false,
  };
};

let nativeStorage: MMKV | null = null;
let storageError = '';

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
    storageError = 'probe read/write failed';
  }
} catch (error: any) {
  nativeStorage = null;
  storageError = String(error?.message || error || 'unknown mmkv error');
}

const memoryMap = new Map<string, string>();

export interface StorageDebugInfo {
  backend: 'mmkv' | 'memory';
  error: string;
  env: {
    platform: string;
    execEnv: string;
    syncHook: boolean;
    bridgeless: boolean;
  };
}

export const getStorageDebugInfo = (): StorageDebugInfo => ({
  backend: nativeStorage !== null ? 'mmkv' : 'memory',
  error: storageError,
  env: getEnvInfo(),
});

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
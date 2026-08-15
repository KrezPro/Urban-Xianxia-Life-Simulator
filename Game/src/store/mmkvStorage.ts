import { Platform } from 'react-native';
import { StateStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

declare const require: (moduleId: string) => any;

// Отпечаток окружения для самообъяснимой диагностики (урок: скриншот должен
// сам показывать среду выполнения и причину деградации).
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

interface SyncBackend {
  name: 'mmkv' | 'sqlite' | 'memory';
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

// Уровень 1: MMKV (основной по правилам архитектуры) с probe-тестом.
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

// Уровень 2: expo-sqlite sync-API (openDatabaseSync/runSync/getFirstSync) —
// полностью синхронная страховка, не зависящая от Nitro/MMKV.
const createSqliteBackend = (): SyncBackend | null => {
  try {
    const SQLiteModule = require('expo-sqlite');
    const open =
      SQLiteModule?.openDatabaseSync || SQLiteModule?.default?.openDatabaseSync;
    if (typeof open !== 'function') {
      backendErrors.push('sqlite: openDatabaseSync not found');
      return null;
    }
    const db = open('bitcultivator-kv.db');
    db.execSync('CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT);');
    const probeKey = '__kv_probe__';
    db.runSync('INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?);', [probeKey, '1']);
    const row: any = db.getFirstSync('SELECT value FROM kv WHERE key = ?;', [probeKey]);
    db.runSync('DELETE FROM kv WHERE key = ?;', [probeKey]);
    if (!row || row.value !== '1') {
      backendErrors.push('sqlite: probe read/write failed');
      return null;
    }
    return {
      name: 'sqlite',
      set: (key, value) => {
        db.runSync('INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?);', [key, value]);
      },
      getString: (key) => {
        const r: any = db.getFirstSync('SELECT value FROM kv WHERE key = ?;', [key]);
        if (r && typeof r.value === 'string') {
          return r.value;
        }
        return undefined;
      },
      delete: (key) => {
        db.runSync('DELETE FROM kv WHERE key = ?;', [key]);
      },
    };
  } catch (error: any) {
    backendErrors.push(`sqlite: ${String(error?.message || error || 'unknown')}`);
  }
  return null;
};

// Активный уровень выбирается один раз при старте: mmkv -> sqlite -> memory.
const activeBackend: SyncBackend =
  createMmkvBackend() || createSqliteBackend() || memoryBackend;

export interface StorageDebugInfo {
  backend: 'mmkv' | 'sqlite' | 'memory';
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
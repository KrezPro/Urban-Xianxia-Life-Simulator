import { MMKV } from 'react-native-mmkv';
import { StateStorage } from 'zustand/middleware';

// Создаем инстанс синхронного хранилища
export const storage = new MMKV({
  id: 'bitcultivator-storage',
});

// Кастомный сериализатор для поддержки BigInt (так как JSON.stringify падает на BigInt)
export const replacer = (key: string, value: any) => {
  if (typeof value === 'bigint') {
    return value.toString() + 'n'; // Сохраняем как строку с суффиксом 'n'
  }
  return value;
};

// Кастомный десериализатор для восстановления BigInt
export const reviver = (key: string, value: any) => {
  if (typeof value === 'string' && /^-?\d+n$/.test(value)) {
    return BigInt(value.slice(0, -1)); // Восстанавливаем BigInt из строки
  }
  return value;
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
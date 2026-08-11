import AsyncStorage from '@react-native-async-storage/async-storage';
import { StateStorage } from 'zustand/middleware';

// ВРЕМЕННЫЙ АДАПТЕР ДЛЯ EXPO GO
// Так как Expo Go не поддерживает нативные C++ модули (MMKV), 
// мы используем AsyncStorage для этапа разработки.
export const zustandStorage: StateStorage = {
  setItem: async (name, value) => {
    await AsyncStorage.setItem(name, value);
  },
  getItem: async (name) => {
    const value = await AsyncStorage.getItem(name);
    return value ?? null;
  },
  removeItem: async (name) => {
    await AsyncStorage.removeItem(name);
  },
};
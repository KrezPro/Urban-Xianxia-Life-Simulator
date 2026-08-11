import React from 'react';
import { SafeAreaView, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import TabNavigator from './navigation/TabNavigator';
import { usePlayerStore } from './store/usePlayerStore';
import { useIdleProgress } from './hooks/useIdleProgress';
import { useLocaleStore } from './store/useLocaleStore';
import ruUI from './locales/ru/ui.json';
import enUI from './locales/en/ui.json';

export default function App() {
  const { hasHydrated } = usePlayerStore();
  const locale = useLocaleStore((state) => state.locale);
  const uiData: any = locale === 'ru' ? ruUI : enUI;

  useIdleProgress();

  if (!hasHydrated) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>{uiData.app.loading}</Text>
      </SafeAreaView>
    );
  }

  return (
    <NavigationContainer>
      <TabNavigator />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  loadingText: {
    color: '#8e44ad',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
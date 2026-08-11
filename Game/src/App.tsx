import React from 'react';
import { SafeAreaView, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import TabNavigator from './navigation/TabNavigator';
import { usePlayerStore } from './store/usePlayerStore';
import { useLocaleStore } from './store/useLocaleStore';
import { useIdleProgress } from './hooks/useIdleProgress';
import ruUI from './locales/ru/ui.json';
import enUI from './locales/en/ui.json';

export default function App() {
  const playerHydrated = usePlayerStore((state) => state.hasHydrated);
  const localeHydrated = useLocaleStore((state) => state.hasHydrated);
  const locale = useLocaleStore((state) => state.locale);
  const ui: any = locale === 'ru' ? ruUI : enUI;

  useIdleProgress();

  if (!playerHydrated || !localeHydrated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#8e44ad" />
          <Text style={styles.loadingText}>{ui.app.loading}</Text>
        </View>
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
  loadingCard: {
    backgroundColor: '#1E1E1E',
    borderColor: '#333',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  loadingText: {
    color: '#aaa',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 16,
  },
});
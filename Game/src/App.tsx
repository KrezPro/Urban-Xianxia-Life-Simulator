import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import TabNavigator from './navigation/TabNavigator';
import { NotificationHost } from './components/game/NotificationHost';
import { usePlayerStore } from './store/usePlayerStore';
import { useLocaleStore } from './store/useLocaleStore';
import { Theme } from './constants/Theme';
import { scaleFont, scaleSize } from './utils/layout';
import ruUI from './locales/ru/ui.json';
import enUI from './locales/en/ui.json';

export default function App() {
  const playerHydrated = usePlayerStore((state) => state.hasHydrated);
  const localeHydrated = useLocaleStore((state) => state.hasHydrated);
  const locale = useLocaleStore((state) => state.locale);

  const uiData: any = locale === 'ru' ? ruUI : enUI;

  if (!playerHydrated || !localeHydrated) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primarySoft} />
          <Text style={styles.loadingText}>{uiData.app.loading}</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <NavigationContainer>
          <TabNavigator />
        </NavigationContainer>

        <NotificationHost />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
  },
  loadingCard: {},
  loadingText: {
    color: Theme.colors.textMuted,
    fontSize: scaleFont(16),
    fontWeight: '700',
    marginTop: scaleSize(16),
  },
});
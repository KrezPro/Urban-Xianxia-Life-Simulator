import React from 'react';
import { SafeAreaView, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import TabNavigator from './navigation/TabNavigator';
import { usePlayerStore } from './store/usePlayerStore';
import { useLocaleStore } from './store/useLocaleStore';
import { useSocialStore } from './store/useSocialStore';
import { useIdleProgress } from './hooks/useIdleProgress';
import { Theme } from './constants/Theme';
import ruUI from './locales/ru/ui.json';
import enUI from './locales/en/ui.json';

export default function App() {
  const playerHydrated = usePlayerStore((state) => state.hasHydrated);
  const localeHydrated = useLocaleStore((state) => state.hasHydrated);
  const socialHydrated = useSocialStore((state) => state.hasHydrated);
  const locale = useLocaleStore((state) => state.locale);
  const uiData: any = locale === 'ru' ? ruUI : enUI;

  useIdleProgress();

  if (!playerHydrated || !localeHydrated || !socialHydrated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={Theme.colors.primarySoft} />
          <Text style={styles.loadingText}>{uiData.app.loading}</Text>
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
    backgroundColor: Theme.colors.background,
  },
  loadingCard: {
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.borderSoft,
    borderWidth: 1,
    borderRadius: Theme.radius.xl,
    paddingVertical: Theme.spacing.xl,
    paddingHorizontal: Theme.spacing.xl,
    alignItems: 'center',
    ...Theme.shadow,
  },
  loadingText: {
    color: Theme.colors.textMuted,
    fontSize: Theme.fontSize.md,
    fontWeight: '700',
    marginTop: Theme.spacing.md,
  },
});
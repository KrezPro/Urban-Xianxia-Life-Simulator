import React, { useEffect } from 'react';
import { Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import TabNavigator from './navigation/TabNavigator';
import { NotificationHost } from './components/game/NotificationHost';
import { LanguageSelectionOverlay } from './components/game/LanguageSelection';
import { usePlayerStore } from './store/usePlayerStore';
import { useLocaleStore } from './store/useLocaleStore';
import { useSocialStore } from './store/useSocialStore';
import { useInventoryStore } from './store/useInventoryStore';
import { useTechniquesStore } from './store/useTechniquesStore';
import { useLifestyleStore } from './store/useLifestyleStore';
import { useSettingsStore } from './store/useSettingsStore';
import { initAudio, disposeAudio } from './audio/AudioManager';
import { useIdleProgress } from './hooks/useIdleProgress';
import { Theme } from './constants/Theme';
import { resolveLocalizedKey } from './utils/i18n';
import { AdService } from './services/AdService';
import { IapService } from './services/IapService';

export default function App() {
  const playerHydrated = usePlayerStore((state) => state.hasHydrated);
  const localeHydrated = useLocaleStore((state) => state.hasHydrated);
  const socialHydrated = useSocialStore((state) => state.hasHydrated);
  const inventoryHydrated = useInventoryStore((state) => state.hasHydrated);
  const techniquesHydrated = useTechniquesStore((state) => state.hasHydrated);
  const lifestyleHydrated = useLifestyleStore((state) => state.hasHydrated);
  const settingsHydrated = useSettingsStore((state) => state.hasHydrated);
  const locale = useLocaleStore((state) => state.locale);
  const hasChosenLanguage = useLocaleStore((state) => state.hasChosenLanguage);

  const loadingText = resolveLocalizedKey(locale, 'ui', 'app.loading');

  const isReady =
    playerHydrated &&
    localeHydrated &&
    socialHydrated &&
    inventoryHydrated &&
    techniquesHydrated &&
    lifestyleHydrated &&
    settingsHydrated;

  useIdleProgress();

  useEffect(() => {
    if (!isReady) {
      return;
    }
    initAudio?.();
    return () => {
      disposeAudio?.();
    };
  }, [isReady]);

  // Инициализация монетизации после гидратации сторов:
  // AdMob (interstitial после смерти + rewarded в Дао) и Google Play Billing
  // (restore покупки remove_ads при старте, чтобы не терять entitlement).
  useEffect(() => {
    if (!isReady) {
      return;
    }
    AdService.initialize();
    IapService.initialize()
      .then(() => IapService.restoreRemoveAds())
      .then((result) => {
        if (result.success) {
          usePlayerStore.getState().setCultivatorPass(true);
        }
      })
      .catch(() => undefined);
  }, [isReady]);

  if (!isReady) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor="transparent" />
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={Theme.colors.primarySoft} />
            <Text style={styles.loadingText}>{loadingText}</Text>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (!hasChosenLanguage) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor="transparent" />
        <LanguageSelectionOverlay />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="transparent" />
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
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettingsStore } from '../store/useSettingsStore';
import { useLocaleStore } from '../store/useLocaleStore';
import { playToggle, getAudioDebugInfo } from '../audio/AudioManager';
import { Button, Card } from '../components/ui';
import { Theme } from '../constants/Theme';
import { getSupportedLocale } from '../constants/Locales';
import { LanguageSelectionModal } from '../components/game/LanguageSelection';
import { useTranslator } from '../hooks/useTranslator';
import { getStorageDebugInfo } from '../store/mmkvStorage';

export default function SettingsScreen() {
  const locale = useLocaleStore((state) => state.locale);
  const soundEnabled = useSettingsStore((state) => state.soundEnabled);
  const musicEnabled = useSettingsStore((state) => state.musicEnabled);
  const setSoundEnabled = useSettingsStore((state) => state.setSoundEnabled);
  const setMusicEnabled = useSettingsStore((state) => state.setMusicEnabled);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  const t = useTranslator('settings');
  const currentLanguage = getSupportedLocale(locale);

  const handleSoundChange = (value: boolean) => {
    setSoundEnabled(value);
    playToggle?.(value, true);
  };

  const handleMusicChange = (value: boolean) => {
    setMusicEnabled(value);
    playToggle?.(value);
  };

  const storageDebug = getStorageDebugInfo();
  const audioDebug = getAudioDebugInfo();
  const storageErrorsText = storageDebug.error ? storageDebug.error : 'none';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('title')}</Text>

        <Card variant="primary" style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{t('sound')}</Text>
              <Text style={styles.rowDesc}>{t('sound_desc')}</Text>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={handleSoundChange}
              trackColor={{ true: Theme.colors.success, false: Theme.colors.border }}
              thumbColor={soundEnabled ? Theme.colors.surface : Theme.colors.textDim}
              ios_backgroundColor={Theme.colors.surfaceLight}
            />
          </View>

          <View style={styles.separator} />

          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{t('music')}</Text>
              <Text style={styles.rowDesc}>{t('music_desc')}</Text>
            </View>
            <Switch
              value={musicEnabled}
              onValueChange={handleMusicChange}
              trackColor={{ true: Theme.colors.success, false: Theme.colors.border }}
              thumbColor={musicEnabled ? Theme.colors.surface : Theme.colors.textDim}
              ios_backgroundColor={Theme.colors.surfaceLight}
            />
          </View>
        </Card>

        <Card variant="primary" style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{t('language')}</Text>
              <Text style={styles.rowDesc}>{t('language_desc')}</Text>
              <Text style={styles.currentLanguageLabel}>{t('language_current')}</Text>
              <Text style={styles.currentLanguage}>{currentLanguage.nativeName}</Text>
            </View>
          </View>
          <Button
            title={t('language_button')}
            onPress={() => setLanguageModalVisible(true)}
            variant="secondary"
            style={styles.languageButton}
          />
        </Card>

        <Card variant="primary" style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Diagnostics</Text>
              <Text style={styles.rowDesc}>Storage: {storageDebug.backend}</Text>
              <Text style={styles.rowDesc}>Storage error: {storageErrorsText}</Text>
              <Text style={styles.rowDesc}>
                Env: {storageDebug.env.platform}/{storageDebug.env.execEnv}
              </Text>
              <Text style={styles.rowDesc}>
                JSI: {storageDebug.env.syncHook ? 'yes' : 'no'} / bridgeless:{' '}
                {storageDebug.env.bridgeless ? 'yes' : 'no'}
              </Text>
              <Text style={styles.rowDesc}>Audio init: {audioDebug.initialized ? 'yes' : 'no'}</Text>
              <Text style={styles.rowDesc}>Audio avail: {audioDebug.available ? 'yes' : 'no'}</Text>
              <Text style={styles.rowDesc}>
                Music loaded: {audioDebug.musicSoundLoaded ? 'yes' : 'no'}
              </Text>
              <Text style={styles.rowDesc}>Audio error: {audioDebug.lastError || 'none'}</Text>
              <Text style={styles.rowDesc}>AV: {audioDebug.avError || 'ok'}</Text>
              <Text style={styles.rowDesc}>FS: {audioDebug.fsError || 'ok'}</Text>
              <Text style={styles.rowDesc}>Dev mode: {audioDebug.isDev ? 'yes' : 'no'}</Text>
            </View>
          </View>
        </Card>

        <LanguageSelectionModal
          visible={languageModalVisible}
          onClose={() => setLanguageModalVisible(false)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  content: {
    padding: Theme.spacing.md,
    paddingBottom: 32,
  },
  title: {
    fontSize: Theme.fontSize.xl,
    fontWeight: '900',
    color: Theme.colors.text,
    textAlign: 'center',
    marginBottom: Theme.spacing.lg,
  },
  card: {
    marginBottom: Theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  rowText: {
    flex: 1,
    marginRight: Theme.spacing.md,
  },
  rowTitle: {
    color: Theme.colors.text,
    fontSize: Theme.fontSize.md,
    fontWeight: '800',
    marginBottom: 4,
  },
  rowDesc: {
    color: Theme.colors.textMuted,
    fontSize: Theme.fontSize.sm,
  },
  separator: {
    height: 1,
    backgroundColor: Theme.colors.borderSoft,
    marginVertical: Theme.spacing.sm,
  },
  currentLanguageLabel: {
    marginTop: 8,
    color: Theme.colors.textDim,
    fontSize: Theme.fontSize.xs,
  },
  currentLanguage: {
    marginTop: 2,
    color: Theme.colors.secondary,
    fontSize: Theme.fontSize.sm,
    fontWeight: '800',
  },
  languageButton: {
    marginTop: Theme.spacing.sm,
  },
});
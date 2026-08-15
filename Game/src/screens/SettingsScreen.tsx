import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore, MusicStyle } from '../store/useSettingsStore';
import { useLocaleStore } from '../store/useLocaleStore';
import { playToggle, playUiPress, getAudioDebugInfo } from '../audio/AudioManager';
import { getStorageDebugInfo } from '../store/mmkvStorage';
import { Button, Card } from '../components/ui';
import { Theme } from '../constants/Theme';
import { getSupportedLocale } from '../constants/Locales';
import { LanguageSelectionModal } from '../components/game/LanguageSelection';
import { useTranslator } from '../hooks/useTranslator';

declare const require: (moduleId: string) => any;

const MUSIC_STYLES: MusicStyle[] = ['calm', 'mystic', 'energetic'];

export default function SettingsScreen() {
  const locale = useLocaleStore((state) => state.locale);
  const soundEnabled = useSettingsStore((state) => state.soundEnabled);
  const musicEnabled = useSettingsStore((state) => state.musicEnabled);
  const musicSeed = useSettingsStore((state) => state.musicSeed);
  const musicStyle = useSettingsStore((state) => state.musicStyle);
  const setSoundEnabled = useSettingsStore((state) => state.setSoundEnabled);
  const setMusicEnabled = useSettingsStore((state) => state.setMusicEnabled);
  const setMusicSeed = useSettingsStore((state) => state.setMusicSeed);
  const setMusicStyle = useSettingsStore((state) => state.setMusicStyle);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [diagVisible, setDiagVisible] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const handleStyleChange = (style: MusicStyle) => {
    playUiPress?.();
    setMusicStyle(style);
  };

  const handleGenerate = () => {
    playUiPress?.();
    const seed = Math.floor(Math.random() * 99999) + 1;
    setMusicSeed(seed);
  };

  const buildDiagnosticsText = (): string => {
    const s = getStorageDebugInfo();
    const a = getAudioDebugInfo();
    return [
      'App: BitCultivator',
      `Storage: ${s.backend}`,
      `Storage errors: ${s.errors && s.errors.length > 0 ? s.errors.join(' | ') : 'none'}`,
      `Env: ${s.env.platform}/${s.env.execEnv} JSI:${s.env.syncHook ? 'yes' : 'no'} bridgeless:${
        s.env.bridgeless ? 'yes' : 'no'
      }`,
      `Audio init:${a.initialized ? 'yes' : 'no'} avail:${a.available ? 'yes' : 'no'} music:${
        a.musicSoundLoaded ? 'yes' : 'no'
      }`,
      `Audio error: ${a.lastError || 'none'}`,
      `AV: ${a.avError || 'ok'} FS: ${a.fsError || 'ok'}`,
    ].join('\n');
  };

  const handleCopy = async () => {
    playUiPress?.();
    try {
      const Clipboard = require('expo-clipboard');
      const setString = Clipboard?.setStringAsync || Clipboard?.default?.setStringAsync;
      if (typeof setString === 'function') {
        await setString(buildDiagnosticsText());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Буфер недоступен: тихо игнорируем.
    }
  };

  const storageDebug = getStorageDebugInfo();
  const audioDebug = getAudioDebugInfo();
  const storageErrorsText =
    storageDebug.errors && storageDebug.errors.length > 0
      ? storageDebug.errors.join(' | ')
      : 'none';

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
              <Text style={styles.rowTitle}>{t('music_generator')}</Text>
              <Text style={styles.rowDesc}>
                {t('music_seed_label')} #{musicSeed} · {t(`music_style_${musicStyle}`)}
              </Text>
            </View>
          </View>
          <View style={styles.styleRow}>
            {MUSIC_STYLES.map((style) => (
              <Button
                key={style}
                title={t(`music_style_${style}`)}
                onPress={() => handleStyleChange(style)}
                variant={musicStyle === style ? 'primary' : 'secondary'}
                small
                style={styles.styleChip}
              />
            ))}
          </View>
          <Button
            title={t('music_generate')}
            onPress={handleGenerate}
            variant="gold"
            icon="sparkles"
            style={styles.generateButton}
          />
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
          <TouchableOpacity
            style={styles.diagHeader}
            onPress={() => {
              playUiPress?.();
              setDiagVisible((v) => !v);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.rowTitle}>{t('diagnostics')}</Text>
            <Ionicons
              name={diagVisible ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={Theme.colors.textMuted}
            />
          </TouchableOpacity>
          {!diagVisible ? (
            <Text style={styles.rowDesc}>{t('diagnostics_hint')}</Text>
          ) : (
            <View>
              <Text style={styles.rowDesc}>Storage: {storageDebug.backend}</Text>
              <Text style={styles.rowDesc}>Storage errors: {storageErrorsText}</Text>
              <Text style={styles.rowDesc}>
                Env: {storageDebug.env.platform}/{storageDebug.env.execEnv}
              </Text>
              <Text style={styles.rowDesc}>
                JSI: {storageDebug.env.syncHook ? 'yes' : 'no'} / bridgeless:{' '}
                {storageDebug.env.bridgeless ? 'yes' : 'no'}
              </Text>
              <Text style={styles.rowDesc}>
                Audio init: {audioDebug.initialized ? 'yes' : 'no'}
              </Text>
              <Text style={styles.rowDesc}>
                Audio avail: {audioDebug.available ? 'yes' : 'no'}
              </Text>
              <Text style={styles.rowDesc}>
                Music loaded: {audioDebug.musicSoundLoaded ? 'yes' : 'no'}
              </Text>
              <Text style={styles.rowDesc}>Audio error: {audioDebug.lastError || 'none'}</Text>
              <Text style={styles.rowDesc}>AV: {audioDebug.avError || 'ok'}</Text>
              <Text style={styles.rowDesc}>FS: {audioDebug.fsError || 'ok'}</Text>
              <Button
                title={copied ? t('diagnostics_copied') : t('diagnostics_copy')}
                onPress={handleCopy}
                variant="secondary"
                small
                icon="copy-outline"
                style={styles.copyButton}
              />
            </View>
          )}
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
    marginBottom: 2,
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
  styleRow: {
    flexDirection: 'row',
    marginBottom: Theme.spacing.sm,
  },
  styleChip: {
    flex: 1,
    marginRight: 6,
  },
  generateButton: {
    marginTop: 2,
  },
  diagHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  copyButton: {
    marginTop: Theme.spacing.sm,
  },
});
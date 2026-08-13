import React from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '../store/useSettingsStore';
import { useLocaleStore } from '../store/useLocaleStore';
import { playToggle, playUiPress } from '../audio/AudioManager';
import { Card } from '../components/ui';
import { Theme } from '../constants/Theme';
import { Locale } from '../types';
import ruSettings from '../locales/ru/settings.json';
import enSettings from '../locales/en/settings.json';

export default function SettingsScreen() {
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);
  const soundEnabled = useSettingsStore((state) => state.soundEnabled);
  const musicEnabled = useSettingsStore((state) => state.musicEnabled);
  const setSoundEnabled = useSettingsStore((state) => state.setSoundEnabled);
  const setMusicEnabled = useSettingsStore((state) => state.setMusicEnabled);

  const ui: any = locale === 'ru' ? ruSettings : enSettings;

  const languageOptions: { code: Locale; label: string }[] = [
    { code: 'en', label: ui.language_en },
    { code: 'ru', label: ui.language_ru },
  ];

  const handleSoundChange = (value: boolean) => {
    setSoundEnabled(value);
    playToggle?.(value, true);
  };

  const handleMusicChange = (value: boolean) => {
    setMusicEnabled(value);
    playToggle?.(value);
  };

  const handleSelectLanguage = (nextLocale: Locale) => {
    playUiPress?.();
    if (locale !== nextLocale) {
      setLocale(nextLocale);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{ui.title}</Text>

        <Card variant="primary" style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{ui.language}</Text>
              <Text style={styles.rowDesc}>{ui.language_desc}</Text>
            </View>
          </View>
          <View style={styles.languageOptions}>
            {languageOptions.map((option) => {
              const active = locale === option.code;
              return (
                <TouchableOpacity
                  key={option.code}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  style={[styles.languageOption, active && styles.languageOptionActive]}
                  onPress={() => handleSelectLanguage(option.code)}
                >
                  <Text
                    style={[
                      styles.languageOptionText,
                      active && styles.languageOptionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {active ? (
                    <Ionicons name="checkmark-circle" size={18} color={Theme.colors.success} />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        <Card variant="primary" style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{ui.sound}</Text>
              <Text style={styles.rowDesc}>{ui.sound_desc}</Text>
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
              <Text style={styles.rowTitle}>{ui.music}</Text>
              <Text style={styles.rowDesc}>{ui.music_desc}</Text>
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
  languageOptions: {
    marginTop: Theme.spacing.sm,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Theme.colors.surfaceLight,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 12,
    marginBottom: Theme.spacing.sm,
  },
  languageOptionActive: {
    borderColor: Theme.colors.success,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
  },
  languageOptionText: {
    color: Theme.colors.textDim,
    fontSize: Theme.fontSize.md,
    fontWeight: '800',
  },
  languageOptionTextActive: {
    color: Theme.colors.text,
  },
});
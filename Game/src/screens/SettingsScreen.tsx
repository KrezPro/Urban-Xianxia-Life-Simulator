import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '../store/useSettingsStore';
import { useLocaleStore } from '../store/useLocaleStore';
import { playToggle, playUiPress } from '../audio/AudioManager';
import { Button, Card } from '../components/ui';
import { Theme } from '../constants/Theme';
import { SUPPORTED_LOCALES, getSupportedLocale } from '../constants/Locales';
import ruSettings from '../locales/ru/settings.json';
import enSettings from '../locales/en/settings.json';

export default function SettingsScreen() {
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);
  const soundEnabled = useSettingsStore((state) => state.soundEnabled);
  const musicEnabled = useSettingsStore((state) => state.musicEnabled);
  const setSoundEnabled = useSettingsStore((state) => state.setSoundEnabled);
  const setMusicEnabled = useSettingsStore((state) => state.setMusicEnabled);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  const ui: any = locale === 'ru' ? ruSettings : enSettings;
  const currentLanguage = getSupportedLocale(locale);

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
    setLanguageModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{ui.title}</Text>

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

        <Card variant="primary" style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{ui.language}</Text>
              <Text style={styles.rowDesc}>{ui.language_desc}</Text>
              <Text style={styles.currentLanguageLabel}>{ui.language_current}</Text>
              <Text style={styles.currentLanguage}>{currentLanguage.nativeName}</Text>
            </View>
          </View>
          <Button
            title={ui.language_button}
            onPress={() => setLanguageModalVisible(true)}
            variant="secondary"
            style={styles.languageButton}
          />
        </Card>

        <Modal
          visible={languageModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setLanguageModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>{ui.language}</Text>

              <ScrollView style={styles.languageList} contentContainerStyle={styles.languageListContent}>
                {SUPPORTED_LOCALES.map((option) => {
                  const active = locale === option.code;
                  return (
                    <TouchableOpacity
                      key={option.code}
                      activeOpacity={0.85}
                      accessibilityRole="button"
                      style={[styles.languageOption, active && styles.languageOptionActive]}
                      onPress={() => handleSelectLanguage(option.code)}
                    >
                      <View style={styles.languageTextBlock}>
                        <Text style={[styles.languageNative, active && styles.languageNativeActive]}>
                          {option.nativeName}
                        </Text>
                        <Text style={styles.languageEnglish}>{option.englishName}</Text>
                      </View>
                      {active ? (
                        <Ionicons name="checkmark-circle" size={18} color={Theme.colors.success} />
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Button
                title={ui.language_close}
                onPress={() => setLanguageModalVisible(false)}
                variant="ghost"
                small
                style={styles.closeButton}
              />
            </View>
          </View>
        </Modal>
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    padding: Theme.spacing.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '82%',
    alignSelf: 'center',
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    padding: Theme.spacing.md,
    ...Theme.shadow,
  },
  modalTitle: {
    color: Theme.colors.text,
    fontSize: Theme.fontSize.lg,
    fontWeight: '900',
    marginBottom: Theme.spacing.sm,
  },
  languageList: {
    maxHeight: 360,
    flexGrow: 0,
  },
  languageListContent: {
    paddingBottom: Theme.spacing.sm,
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
  languageTextBlock: {
    flex: 1,
    marginRight: Theme.spacing.sm,
  },
  languageNative: {
    color: Theme.colors.textDim,
    fontSize: Theme.fontSize.md,
    fontWeight: '800',
  },
  languageNativeActive: {
    color: Theme.colors.text,
  },
  languageEnglish: {
    color: Theme.colors.textDim,
    fontSize: Theme.fontSize.xs,
    marginTop: 2,
  },
  closeButton: {
    marginTop: Theme.spacing.sm,
  },
});
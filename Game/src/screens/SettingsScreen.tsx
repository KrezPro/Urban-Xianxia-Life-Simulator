import React from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettingsStore } from '../store/useSettingsStore';
import { useLocaleStore } from '../store/useLocaleStore';
import { AudioManager } from '../audio/AudioManager';
import { Card } from '../components/ui';
import { Theme } from '../constants/Theme';
import ruUI from '../locales/ru/ui.json';
import enUI from '../locales/en/ui.json';

export default function SettingsScreen() {
  const locale = useLocaleStore((state) => state.locale);
  const soundEnabled = useSettingsStore((state) => state.soundEnabled);
  const musicEnabled = useSettingsStore((state) => state.musicEnabled);
  const setSoundEnabled = useSettingsStore((state) => state.setSoundEnabled);
  const setMusicEnabled = useSettingsStore((state) => state.setMusicEnabled);

  const ui: any = locale === 'ru' ? (ruUI as any).settings_screen : (enUI as any).settings_screen;

  const handleSoundChange = (value: boolean) => {
    setSoundEnabled(value);
    AudioManager.playToggle(value, true);
  };

  const handleMusicChange = (value: boolean) => {
    setMusicEnabled(value);
    AudioManager.playToggle(value);
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
});
import React from 'react';
import { SafeAreaView, Text, StyleSheet, ScrollView } from 'react-native';
import { usePlayerStore } from '../store/usePlayerStore';
import { useLocaleStore } from '../store/useLocaleStore';
import { Button, Card, StatRow } from '../components/ui';
import { Theme } from '../constants/Theme';
import { formatLargeNumber } from '../utils/helpers';
import ruUI from '../locales/ru/ui.json';
import enUI from '../locales/en/ui.json';

export default function ProfileScreen() {
  const player = usePlayerStore();
  const locale = useLocaleStore((state) => state.locale);
  const ui: any = locale === 'ru' ? ruUI : enUI;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>{ui.profile_screen.title}</Text>

        <Card>
          <StatRow icon="hourglass" label={ui.profile_screen.age} value={player.age.toString()} />
          <StatRow icon="flash" label={ui.profile_screen.stage} value={player.cultivationStage} />
          <StatRow icon="heart" label={ui.profile_screen.health} value={player.health.toString()} color={Theme.colors.success} />
          <StatRow icon="school" label={ui.profile_screen.intelligence} value={player.intelligence.toString()} color={Theme.colors.secondary} />
          <StatRow icon="diamond" label={ui.profile_screen.appearance} value={player.appearance.toString()} color={Theme.colors.warning} />
          <StatRow icon="cash" label={ui.profile_screen.money} value={`$${formatLargeNumber(player.money)}`} color={Theme.colors.gold} />
          <StatRow icon="flame" label={ui.profile_screen.qi} value={formatLargeNumber(player.qi)} color={Theme.colors.info} />
          <StatRow icon="sparkles" label={ui.profile_screen.karma} value={formatLargeNumber(player.karma)} color={Theme.colors.primarySoft} />
        </Card>

        <Button
          title={ui.profile_screen.btn_grow}
          onPress={player.growOlder}
          variant="primary"
          icon="hourglass"
          style={styles.button}
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
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: '900',
    color: Theme.colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    marginTop: 20,
  },
});
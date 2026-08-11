import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { usePlayerStore } from '../store/usePlayerStore';
import { useLocaleStore } from '../store/useLocaleStore';
import { formatLargeNumber } from '../utils/formatUtils';
import ruUI from '../locales/ru/ui.json';
import enUI from '../locales/en/ui.json';

export default function ProfileScreen() {
  const player = usePlayerStore();
  const locale = useLocaleStore((state) => state.locale);
  const uiData: any = locale === 'ru' ? ruUI : enUI;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>{uiData.profile_screen.title}</Text>

      <View style={styles.statsCard}>
        <Text style={styles.statText}>
          {uiData.profile_screen.age}: {player.age}
        </Text>
        <Text style={styles.statText}>
          {uiData.profile_screen.stage}: {player.cultivationStage}
        </Text>
        <Text style={styles.statText}>
          {uiData.profile_screen.health}: {player.health}
        </Text>
        <Text style={styles.statText}>
          {uiData.profile_screen.intelligence}: {player.intelligence}
        </Text>
        <Text style={styles.statText}>
          {uiData.profile_screen.appearance}: {player.appearance}
        </Text>
        <Text style={styles.statText}>
          {uiData.profile_screen.money}: ${formatLargeNumber(player.money)}
        </Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={player.growOlder} activeOpacity={0.8}>
        <Text style={styles.buttonText}>{uiData.profile_screen.btn_grow}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00ffcc',
    marginBottom: 20,
    marginTop: 10,
  },
  statsCard: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    width: '100%',
    marginBottom: 30,
  },
  statText: {
    color: '#fff',
    fontSize: 16,
    marginVertical: 4,
  },
  button: {
    backgroundColor: '#00ffcc',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  buttonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
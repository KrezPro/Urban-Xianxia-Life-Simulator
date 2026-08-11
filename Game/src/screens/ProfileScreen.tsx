import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { usePlayerStore } from '../store/usePlayerStore';

export default function ProfileScreen() {
  const { age, cultivationStage, health, intellect, charm, money, incrementAge } = usePlayerStore();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>BitCultivator</Text>
      
      <View style={styles.statsCard}>
        <Text style={styles.statText}>Возраст: {age} лет</Text>
        <Text style={styles.statText}>Стадия: {cultivationStage}</Text>
        <Text style={styles.statText}>Здоровье: {health}/100</Text>
        <Text style={styles.statText}>Интеллект: {intellect}</Text>
        <Text style={styles.statText}>Привлекательность: {charm}</Text>
        <Text style={styles.statText}>Деньги: ${money}</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={incrementAge} activeOpacity={0.8}>
        <Text style={styles.buttonText}>Повзрослеть (+1 год)</Text>
      </TouchableOpacity>
    </View>
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
  }
});
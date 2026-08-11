import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { usePlayerStore } from '../store/usePlayerStore';

export default function DaoScreen() {
  const { qi, spiritualRoot, addQi } = usePlayerStore();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Тайный путь</Text>
      
      <View style={styles.card}>
        <Text style={styles.statText}>Духовный корень: {spiritualRoot}</Text>
        <Text style={styles.statText}>Накоплено Ци: {qi}</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => addQi("10")} activeOpacity={0.8}>
        <Text style={styles.buttonText}>Медитировать (+10 Ци)</Text>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00ffcc',
    marginBottom: 20,
    marginTop: 10,
  },
  card: {
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
    backgroundColor: '#1a1a1a',
    borderColor: '#00ffcc',
    borderWidth: 2,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  buttonText: {
    color: '#00ffcc',
    fontSize: 18,
    fontWeight: 'bold',
  }
});
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function LogScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Журнал судьбы</Text>
      <Text style={styles.subtitle}>События вашей жизни будут записываться здесь.</Text>
      <Text style={styles.subtitle}>(Интеграция FlashList на следующем этапе)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
  }
});
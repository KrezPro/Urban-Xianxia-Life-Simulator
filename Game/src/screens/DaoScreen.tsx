import React from 'react';
import { SafeAreaView, Text, StyleSheet } from 'react-native';

export default function DaoScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Путь Дао</Text>
      <Text style={styles.subtitle}>Медитация и культивация скоро появятся здесь...</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
  }
});
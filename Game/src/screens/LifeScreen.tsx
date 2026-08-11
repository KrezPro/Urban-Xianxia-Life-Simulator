import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function LifeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Мирская жизнь</Text>
      <Text style={styles.subtitle}>Здесь будут доступны: школа, работа, инвестиции и отношения.</Text>
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
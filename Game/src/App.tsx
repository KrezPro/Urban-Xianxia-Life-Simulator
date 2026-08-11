import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { usePlayerStore } from './store/usePlayerStore';
import TabNavigator from './navigation/TabNavigator';

export default function App() {
  const { hasHydrated } = usePlayerStore();

  // Защита от гидратации: не рендерим навигацию, пока данные не загружены
  if (!hasHydrated) {
    return (
      <SafeAreaProvider style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>Синхронизация с Дао...</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  // SafeAreaProvider заменяет устаревший SafeAreaView из react-native
  return (
    <SafeAreaProvider style={styles.safeArea}>
      <NavigationContainer>
        <TabNavigator />
      </NavigationContainer>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0a0a',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00ffcc',
    marginBottom: 10,
    letterSpacing: 1,
    textAlign: 'center',
  },
});
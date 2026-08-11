import React from 'react';
import { SafeAreaView, Text, View, Button, StyleSheet } from 'react-native';
import { useTranslation } from './utils/i18n';
import { usePlayerStore } from './store/usePlayerStore';

export default function App() {
  const { t } = useTranslation();
  const { age, growOlder, hasHydrated } = usePlayerStore();

  if (!hasHydrated) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Urban Xianxia</Text>
      <Text style={styles.ageText}>{t('age')}: {age}</Text>
      
      <View style={styles.buttonContainer}>
        <Button title={t('age_button')} onPress={growOlder} />
      </View>
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
  loadingText: {
    color: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 30,
  },
  ageText: {
    fontSize: 20,
    color: '#fff',
    marginBottom: 20,
  },
  buttonContainer: {
    marginTop: 20,
    width: '60%',
  }
});
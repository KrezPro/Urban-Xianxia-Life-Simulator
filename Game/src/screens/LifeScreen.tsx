import React from 'react';
import { SafeAreaView, Text, View, Button, StyleSheet } from 'react-native';
import { usePlayerStore } from '../store/usePlayerStore';
import { useEventStore } from '../store/useEventStore';

export default function LifeScreen() {
  const { age, growOlder } = usePlayerStore();
  const { addLog } = useEventStore();

  const handleGrowOlder = () => {
    growOlder();
    addLog(`Прошел год. Вам теперь ${age + 1} лет.`, 'mundane');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Urban Xianxia</Text>
      <Text style={styles.ageText}>Возраст: {age}</Text>
      
      <View style={styles.buttonContainer}>
        <Button title="Повзрослеть (+1 год)" onPress={handleGrowOlder} />
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
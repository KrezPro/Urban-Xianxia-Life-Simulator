import React from 'react';
import { SafeAreaView, Text, View, Button, StyleSheet, ScrollView } from 'react-native';
import { usePlayerStore } from '../store/usePlayerStore';
import { useEventStore } from '../store/useEventStore';
import eventsData from '../data/events.json';

export default function LifeScreen() {
  const player = usePlayerStore();
  const { addLog } = useEventStore();

  const handleGrowOlder = () => {
    player.growOlder();
    
    // Определяем, произойдет мирское или тайное событие (20% шанс тайного)
    const isSecretEvent = Math.random() < 0.2;
    const eventPool = isSecretEvent ? eventsData.secret : eventsData.mundane;
    const randomEvent = eventPool[Math.floor(Math.random() * eventPool.length)];

    // Применяем эффекты к состоянию
    player.applyEffects(randomEvent.effects);
    
    // Записываем лог в Журнал
    addLog(
      `Вам исполнилось ${player.age + 1}. ${randomEvent.text}`, 
      isSecretEvent ? 'secret' : 'mundane'
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Urban Xianxia</Text>
        
        <View style={styles.statsCard}>
          <Text style={styles.statText}>Возраст: {player.age}</Text>
          <Text style={styles.statText}>Здоровье: {player.health}</Text>
          <Text style={styles.statText}>Интеллект: {player.intelligence}</Text>
          <Text style={styles.statText}>Привлекательность: {player.appearance}</Text>
          <Text style={styles.statText}>Деньги: ${player.money}</Text>
          <Text style={styles.statText}>Энергия Ци: {player.qi}</Text>
          <Text style={styles.statText}>Карма: {player.karma}</Text>
        </View>
        
        <View style={styles.buttonContainer}>
          <Button title="Повзрослеть (+1 год)" onPress={handleGrowOlder} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  statsCard: {
    backgroundColor: '#1E1E1E',
    padding: 20,
    borderRadius: 10,
    width: '100%',
    marginBottom: 30,
  },
  statText: {
    fontSize: 16,
    color: '#DDD',
    marginBottom: 8,
  },
  buttonContainer: {
    width: '80%',
  }
});
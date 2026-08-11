import React, { useEffect } from 'react';
import { SafeAreaView, Text, View, Button, StyleSheet, ScrollView } from 'react-native';
import { usePlayerStore } from '../store/usePlayerStore';
import { useEventStore } from '../store/useEventStore';
import eventsData from '../data/events.json';

export default function LifeScreen() {
  const player = usePlayerStore();
  const { addLog } = useEventStore();

  useEffect(() => {
    // Инициализация при первом запуске игры
    if (player.age === 0 && player.money === 0 && player.health === 100 && player.qi === "0" && !player.isDead) {
      player.reincarnate();
      addLog("Вы родились в этом мире. Ваша история начинается...", "system");
    }
  }, []);

  useEffect(() => {
    if (player.isDead) {
      addLog("Вы умерли. Ваша душа отправляется в бесконечный цикл Сансары...", "system");
    }
  }, [player.isDead]);

  const handleGrowOlder = () => {
    player.growOlder();
    
    // Определяем, произойдет мирское или тайное событие (20% шанс тайного)
    // Инвертировано условие, чтобы не использовать знак меньше
    const isSecretEvent = 0.2 > Math.random();
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

  const handleReincarnate = () => {
    player.reincarnate();
    addLog("Колесо Сансары совершило оборот. Вы переродились в новом теле.", "system");
  };

  if (player.isDead) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.deadContainer}>
          <Text style={styles.deadTitle}>ВЫ МЕРТВЫ</Text>
          <Text style={styles.deadSubtitle}>Ваш жизненный путь прерван.</Text>
          <Text style={styles.karmaText}>Накоплено Кармы: {player.karma}</Text>
          <View style={styles.buttonContainer}>
            <Button 
              title="Реинкарнация (Новая жизнь)" 
              color="#e74c3c"
              onPress={handleReincarnate} 
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

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
          <Text style={styles.statText}>Духовный корень: {player.spiritualRoot}</Text>
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
  deadContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  deadTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 10,
  },
  deadSubtitle: {
    fontSize: 18,
    color: '#aaa',
    marginBottom: 30,
  },
  karmaText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#f1c40f',
    marginBottom: 40,
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
    marginTop: 10,
  }
});
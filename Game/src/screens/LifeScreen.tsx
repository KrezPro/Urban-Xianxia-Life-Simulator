import React, { useEffect } from 'react';
import { SafeAreaView, Text, View, Button, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
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
    
    let secretEventChance = 0.1; // Базовый шанс для мирских дел (10%)
    
    if (player.activityFocus === 'secret') {
      secretEventChance = 0.8; // Шанс повышается при тайном фокусе (80%)
      player.addQi(player.spiritualRoot.toString());
      addLog(`Год прошел в тайной медитации. Накоплено ${player.spiritualRoot} энергии Ци.`, 'secret');
    }

    // Определяем, произойдет мирское или тайное событие
    // Инвертировано условие, чтобы не использовать знак меньше
    const isSecretEvent = secretEventChance > Math.random();
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
        
        <View style={styles.focusContainer}>
          <Text style={styles.focusTitle}>Фокус на этот год:</Text>
          <View style={styles.focusButtons}>
            <TouchableOpacity 
              style={[styles.focusBtn, player.activityFocus === 'mundane' && styles.focusBtnActive]}
              onPress={() => player.setActivityFocus('mundane')}
            >
              <Text style={[styles.focusBtnText, player.activityFocus === 'mundane' && styles.focusBtnTextActive]}>
                Мирские дела
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.focusBtn, player.activityFocus === 'secret' && styles.focusBtnActive]}
              onPress={() => player.setActivityFocus('secret')}
            >
              <Text style={[styles.focusBtnText, player.activityFocus === 'secret' && styles.focusBtnTextActive]}>
                Тайный путь
              </Text>
            </TouchableOpacity>
          </View>
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
    marginBottom: 20,
  },
  statText: {
    fontSize: 16,
    color: '#DDD',
    marginBottom: 8,
  },
  focusContainer: {
    width: '100%',
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  focusTitle: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 10,
  },
  focusButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  focusBtn: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 8,
    backgroundColor: '#2C2C2C',
    alignItems: 'center',
  },
  focusBtnActive: {
    backgroundColor: '#3498db',
  },
  focusBtnText: {
    color: '#888',
    fontWeight: 'bold',
  },
  focusBtnTextActive: {
    color: '#fff',
  },
  buttonContainer: {
    width: '80%',
    marginTop: 10,
    marginBottom: 30,
  }
});
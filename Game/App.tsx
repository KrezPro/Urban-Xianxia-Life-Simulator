import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity } from 'react-native';
import { usePlayerStore } from './src/store/usePlayerStore';

export default function App() {
  const { age, cultivationStage, incrementAge, hasHydrated } = usePlayerStore();

  if (!hasHydrated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>Синхронизация с Дао...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>BitCultivator: Пробуждение</Text>
        <Text style={styles.subtitle}>Путь к бессмертию начинается здесь...</Text>
        
        <View style={styles.statusBox}>
          <Text style={styles.statusText}>Статус: {cultivationStage}</Text>
          <Text style={styles.statusText}>Возраст: {age} лет</Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={incrementAge} activeOpacity={0.8}>
          <Text style={styles.buttonText}>Повзрослеть (+1 год)</Text>
        </TouchableOpacity>

        <StatusBar style="light" />
      </View>
    </SafeAreaView>
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
    padding: 20,
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
  subtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 40,
  },
  statusBox: {
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
  },
  statusText: {
    fontSize: 18,
    color: '#fff',
    marginVertical: 4,
  },
  button: {
    backgroundColor: '#00ffcc',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  buttonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  }
});
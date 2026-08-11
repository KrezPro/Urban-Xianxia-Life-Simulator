import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity } from 'react-native';
import { usePlayerStore } from './store/usePlayerStore';

export default function App() {
  const { age, cultivationStage, incrementAge, hasHydrated } = usePlayerStore();

  // Защита от гидратации: не рендерим UI, пока данные не загружены из MMKV
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
        <Text style={styles.title}>BitCultivator</Text>
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00ffcc', // Cyber-Xianxia theme
    marginBottom: 10,
    letterSpacing: 1,
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
    shadowColor: '#00ffcc',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  }
});
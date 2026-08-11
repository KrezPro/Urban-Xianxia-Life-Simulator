import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, SafeAreaView } from 'react-native';

export default function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>BitCultivator</Text>
        <Text style={styles.subtitle}>Путь к бессмертию начинается здесь...</Text>
        
        <View style={styles.statusBox}>
          <Text style={styles.statusText}>Статус: Смертный</Text>
          <Text style={styles.statusText}>Возраст: 0 лет</Text>
        </View>

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
  },
  statusText: {
    fontSize: 18,
    color: '#fff',
    marginVertical: 4,
  }
});
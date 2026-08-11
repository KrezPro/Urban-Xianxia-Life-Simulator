import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useEventStore, IEventLog } from '../store/useEventStore';

const renderItem = ({ item }: { item: IEventLog }) => {
  const date = new Date(item.timestamp).toLocaleTimeString();
  return (
    <View style={styles.logItem}>
      <Text style={styles.logTime}>[{date}]</Text>
      <Text style={[
        styles.logText, 
        item.type === 'secret' && styles.secretText, 
        item.type === 'system' && styles.systemText
      ]}>
        {item.text}
      </Text>
    </View>
  );
};

export default function LogScreen() {
  const { logs } = useEventStore();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Журнал судьбы</Text>
      <View style={styles.listContainer}>
        <FlashList
          data={logs}
          renderItem={renderItem}
          estimatedItemSize={50}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Ваш жизненный путь только начинается...</Text>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  logItem: {
    flexDirection: 'row',
    marginBottom: 8,
    padding: 10,
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
  },
  logTime: {
    color: '#888',
    marginRight: 8,
    fontSize: 12,
    marginTop: 2,
  },
  logText: {
    color: '#DDD',
    fontSize: 14,
    flex: 1,
    flexWrap: 'wrap',
  },
  secretText: {
    color: '#9b59b6',
    fontWeight: '600',
  },
  systemText: {
    color: '#e74c3c',
    fontStyle: 'italic',
  },
  emptyText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 50,
    fontStyle: 'italic',
  }
});
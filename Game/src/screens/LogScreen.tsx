import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useEventStore, IEventLog } from '../store/useEventStore';
import { useLocaleStore } from '../store/useLocaleStore';
import { Theme } from '../constants/Theme';
import ruUI from '../locales/ru/ui.json';
import enUI from '../locales/en/ui.json';

const renderItem = ({ item }: { item: IEventLog }) => {
  const date = new Date(item.timestamp).toLocaleTimeString();

  return (
    <View style={styles.logItem}>
      <Text style={styles.logTime}>[{date}]</Text>
      <Text
        style={[
          styles.logText,
          item.type === 'secret' && styles.secretText,
          item.type === 'system' && styles.systemText,
        ]}
      >
        {item.text}
      </Text>
    </View>
  );
};

export default function LogScreen() {
  const { logs } = useEventStore();
  const locale = useLocaleStore((state) => state.locale);
  const uiData: any = locale === 'ru' ? ruUI : enUI;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{uiData.log_screen.title}</Text>
      <View style={styles.listContainer}>
        <FlashList
          data={logs}
          renderItem={renderItem}
          estimatedItemSize={50}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <Text style={styles.emptyText}>{uiData.log_screen.empty}</Text>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.colors.text,
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
    backgroundColor: Theme.colors.card,
    borderRadius: 8,
  },
  logTime: {
    color: Theme.colors.textDim,
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
    color: Theme.colors.info,
    fontWeight: '600',
  },
  systemText: {
    color: Theme.colors.danger,
    fontStyle: 'italic',
  },
  emptyText: {
    color: Theme.colors.textDim,
    textAlign: 'center',
    marginTop: 50,
    fontStyle: 'italic',
  },
});
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useEventStore } from '../store/useEventStore';
import { useLocaleStore } from '../store/useLocaleStore';
import { Theme } from '../constants/Theme';
import { getEventLogText } from '../utils/notificationUtils';
import { EffectChips } from '../components/game/EffectChips';
import { playUiPress } from '../audio/AudioManager';
import { IEventLog } from '../types';
import ruUI from '../locales/ru/ui.json';
import enUI from '../locales/en/ui.json';

interface LogScreenProps {
  onClose?: () => void;
}

const LogItem = ({ item, locale }: { item: IEventLog; locale: 'ru' | 'en' }) => {
  const date = new Date(item.timestamp).toLocaleTimeString();
  const text = getEventLogText(item, locale);

  return (
    <View style={styles.logItem}>
      <Text style={styles.logTime}>[{date}]</Text>
      <View style={styles.logBody}>
        <Text
          style={[
            styles.logText,
            item.type === 'secret' && styles.secretText,
            item.type === 'system' && styles.systemText,
          ]}
        >
          {text}
        </Text>
        {!!item.effects?.length ? <EffectChips effects={item.effects} /> : null}
      </View>
    </View>
  );
};

export default function LogScreen({ onClose }: LogScreenProps) {
  const { logs } = useEventStore();
  const locale = useLocaleStore((state) => state.locale);
  const ui: any = locale === 'ru' ? ruUI : enUI;

  const handleClose = () => {
    if (onClose) {
      playUiPress?.();
      onClose();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{ui.log_screen.title}</Text>
        {!!onClose ? (
          <Text style={styles.closeButton} onPress={handleClose}>
            ✕
          </Text>
        ) : null}
      </View>
      <View style={styles.listContainer}>
        <FlashList
          data={logs}
          renderItem={({ item }) => <LogItem item={item} locale={locale} />}
          estimatedItemSize={84}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<Text style={styles.emptyText}>{ui.log_screen.empty}</Text>}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    paddingTop: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: Theme.colors.text,
  },
  closeButton: {
    color: Theme.colors.textMuted,
    fontSize: 24,
    fontWeight: '900',
    paddingHorizontal: 8,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  logItem: {
    flexDirection: 'row',
    marginBottom: 8,
    padding: 12,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
  },
  logTime: {
    color: Theme.colors.textDim,
    marginRight: 8,
    fontSize: 12,
    marginTop: 2,
  },
  logBody: {
    flex: 1,
  },
  logText: {
    color: Theme.colors.text,
    fontSize: 14,
    flexWrap: 'wrap',
    lineHeight: 20,
  },
  secretText: {
    color: Theme.colors.info,
    fontWeight: '700',
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
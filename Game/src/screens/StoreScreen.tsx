import React from 'react';
import { Text, View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlayerStore } from '../store/usePlayerStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { useLocaleStore } from '../store/useLocaleStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { Button, Card } from '../components/ui';
import { Theme } from '../constants/Theme';
import { formatLargeNumber, isGreaterOrEqualBigInt } from '../utils/helpers';
import { getKarmaLevelEffects } from '../utils/gameplayUtils';
import { buildEffectLines } from '../utils/effectFormatter';
import itemsData from '../data/items.json';
import ruUI from '../locales/ru/ui.json';
import enUI from '../locales/en/ui.json';
import ruExtras from '../locales/ru/extras.json';
import enExtras from '../locales/en/extras.json';

export default function StoreScreen() {
  const player = usePlayerStore();
  const inventory = useInventoryStore();
  const locale = useLocaleStore((state) => state.locale);
  const pushUiNotification = useNotificationStore((state) => state.pushUiNotification);

  const ui: any = locale === 'ru' ? ruUI.store_screen : enUI.store_screen;
  const extras: any = locale === 'ru' ? ruExtras : enExtras;
  const storeExtra = extras.store || {};
  const effectLabels = extras.effect_labels || {};

  const getSafeMaxLevel = (item: any): number => {
    const maxLevel = Number(item?.maxLevel || 0);
    if (!Number.isFinite(maxLevel)) {
      return 0;
    }
    return Math.max(0, Math.floor(maxLevel));
  };

  const getSafeCurrentLevel = (item: any): number => {
    const rawLevel = Number(inventory.items[item.id]?.quantity || 0);
    const safeRawLevel = Number.isFinite(rawLevel) ? Math.max(0, Math.floor(rawLevel)) : 0;
    return Math.min(safeRawLevel, getSafeMaxLevel(item));
  };

  const handleBuyLevel = (item: any) => {
    const itemUI = (ui.items as any)[item.id] || { name: item.id, desc: '' };
    const safeMaxLevel = getSafeMaxLevel(item);
    const currentLevel = getSafeCurrentLevel(item);
    const isMax = currentLevel >= safeMaxLevel;

    if (isMax) {
      pushUiNotification('store_upgrade_error', 'danger');
      return;
    }

    const nextLevelData = Array.isArray(item.levels) ? item.levels[currentLevel] : undefined;

    if (!nextLevelData) {
      pushUiNotification('store_upgrade_error', 'danger');
      return;
    }

    const nextCost = nextLevelData?.cost || '0';
    const canAfford = isGreaterOrEqualBigInt(player.karma, nextCost);

    if (!canAfford) {
      pushUiNotification('store_upgrade_error', 'danger');
      return;
    }

    player.deductKarma(nextCost);
    inventory.addItem({ id: item.id, quantity: 1, type: item.type } as any);

    pushUiNotification('store_upgrade_success', 'reward', {
      name: itemUI.name,
      level: (currentLevel + 1).toString(),
    });
  };

  const handleBuyPass = () => {
    player.setCultivatorPass(true);
    pushUiNotification('store_pass_activated', 'reward');
  };

  const safeItems = Array.isArray(itemsData) ? itemsData : [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{ui.title}</Text>

        <Card variant="gold" style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>{ui.karma_balance}</Text>
          <Text style={styles.balanceValue}>{formatLargeNumber(player.karma)}</Text>
        </Card>

        {safeItems
          .filter((item: any) => item.type === 'karma_buff')
          .map((item: any) => {
            const safeMaxLevel = getSafeMaxLevel(item);
            const currentLevel = getSafeCurrentLevel(item);
            const isMax = currentLevel >= safeMaxLevel;
            const nextLevelData = Array.isArray(item.levels)
              ? item.levels[currentLevel]
              : undefined;
            const nextCost = nextLevelData?.cost || '0';
            const canAfford = isGreaterOrEqualBigInt(player.karma, nextCost);
            const itemUI = (ui.items as any)[item.id] || { name: item.id, desc: '' };

            const currentEffects = getKarmaLevelEffects(item.id, currentLevel);
            const currentLines = buildEffectLines(currentEffects, effectLabels, 1);

            const nextEffects = getKarmaLevelEffects(
              item.id,
              Math.min(currentLevel + 1, safeMaxLevel)
            );
            const nextLines = !isMax ? buildEffectLines(nextEffects, effectLabels, 1) : [];

            return (
              <Card key={item.id} style={styles.itemCard}>
                <View style={styles.itemTopRow}>
                  <Text style={styles.itemName}>{itemUI.name}</Text>
                  <Text style={styles.itemLevel}>
                    {storeExtra.level}: {currentLevel}/{safeMaxLevel}
                  </Text>
                </View>

                <Text style={styles.itemDesc}>{itemUI.desc}</Text>

                {currentLevel > 0 && currentLines.length > 0 ? (
                  <View style={styles.effectsBlock}>
                    <Text style={styles.effectsLabel}>{storeExtra.current_effects}</Text>
                    {currentLines.map((line, index) => (
                      <Text key={`${item.id}_current_${index}`} style={styles.effectLine}>
                        {line}
                      </Text>
                    ))}
                  </View>
                ) : null}

                {!isMax && nextLines.length > 0 ? (
                  <View style={styles.effectsBlock}>
                    <Text style={styles.effectsLabel}>{storeExtra.next_effects}</Text>
                    {nextLines.map((line, index) => (
                      <Text key={`${item.id}_next_${index}`} style={styles.effectLine}>
                        {line}
                      </Text>
                    ))}
                  </View>
                ) : null}

                <Text style={styles.effectsNote}>{storeExtra.effects_note}</Text>

                {!isMax ? (
                  <View style={styles.costRow}>
                    <Text style={styles.costLabel}>{storeExtra.next_cost}</Text>
                    <Text style={styles.costValue}>{formatLargeNumber(nextCost)}</Text>
                  </View>
                ) : null}

                <Button
                  title={
                    isMax ? storeExtra.max_level : canAfford ? ui.btn_buy : ui.btn_no_karma
                  }
                  onPress={() => handleBuyLevel(item)}
                  disabled={isMax || !canAfford}
                  variant={isMax ? 'secondary' : canAfford ? 'gold' : 'ghost'}
                  icon={isMax ? 'checkmark-circle' : 'cart'}
                  style={styles.itemButton}
                />
              </Card>
            );
          })}

        <Text style={styles.sectionTitle}>{ui.iap_section}</Text>

        <Card variant="primary" style={styles.iapCard}>
          <Text style={styles.iapName}>{ui.iap_pass}</Text>
          <Text style={styles.iapDesc}>{ui.iap_pass_desc}</Text>
          <Button
            title={player.hasCultivatorPass ? ui.btn_iap_active : ui.btn_iap_buy}
            onPress={handleBuyPass}
            disabled={player.hasCultivatorPass}
            variant={player.hasCultivatorPass ? 'secondary' : 'primary'}
            icon="ribbon"
            style={styles.iapButton}
          />
        </Card>

        <Card style={styles.iapCard}>
          <Text style={styles.iapName}>{ui.iap_ad}</Text>
          <Text style={styles.iapDesc}>{ui.iap_ad_desc}</Text>
          <Button
            title={ui.btn_info}
            onPress={() => undefined}
            disabled
            variant="ghost"
            icon="play-circle"
            style={styles.iapButton}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  content: {
    padding: Theme.spacing.md,
    paddingBottom: 32,
  },
  title: {
    fontSize: Theme.fontSize.xl,
    fontWeight: '900',
    color: Theme.colors.text,
    textAlign: 'center',
    marginBottom: Theme.spacing.lg,
  },
  balanceCard: {
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  balanceLabel: {
    color: Theme.colors.textMuted,
    marginBottom: 4,
  },
  balanceValue: {
    color: Theme.colors.gold,
    fontSize: 36,
    fontWeight: '900',
  },
  itemCard: {
    marginBottom: Theme.spacing.md,
  },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    color: Theme.colors.secondary,
    fontSize: 20,
    fontWeight: '900',
    flex: 1,
  },
  itemLevel: {
    color: Theme.colors.textMuted,
    fontWeight: '800',
    marginLeft: 8,
  },
  itemDesc: {
    color: Theme.colors.textMuted,
    marginBottom: Theme.spacing.md,
  },
  effectsBlock: {
    marginBottom: 8,
  },
  effectsLabel: {
    color: Theme.colors.textDim,
    fontSize: Theme.fontSize.xs,
    marginBottom: 2,
  },
  effectLine: {
    color: Theme.colors.secondary,
    fontSize: Theme.fontSize.xs,
    marginBottom: 2,
  },
  effectsNote: {
    color: Theme.colors.textDim,
    fontSize: Theme.fontSize.xs,
    marginBottom: Theme.spacing.sm,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.sm,
  },
  costLabel: {
    color: Theme.colors.textMuted,
  },
  costValue: {
    color: Theme.colors.gold,
    fontWeight: '800',
  },
  itemButton: {
    alignSelf: 'stretch',
  },
  sectionTitle: {
    color: Theme.colors.text,
    fontSize: 22,
    fontWeight: '900',
    marginTop: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  iapCard: {
    marginBottom: Theme.spacing.md,
  },
  iapName: {
    color: Theme.colors.primarySoft,
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 6,
  },
  iapDesc: {
    color: Theme.colors.textMuted,
    marginBottom: Theme.spacing.md,
  },
  iapButton: {
    alignSelf: 'stretch',
  },
});
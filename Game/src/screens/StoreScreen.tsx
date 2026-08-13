import React, { useState } from 'react';
import { Text, View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlayerStore } from '../store/usePlayerStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { useLocaleStore } from '../store/useLocaleStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { Button, Card, DetailsModal } from '../components/ui';
import { Theme } from '../constants/Theme';
import { formatLargeNumber, isGreaterOrEqualBigInt } from '../utils/helpers';
import { getKarmaLevelEffects } from '../utils/gameplayUtils';
import { buildEffectLines } from '../utils/effectFormatter';
import { resolveLocalizedKey } from '../utils/i18n';
import itemsData from '../data/items.json';

interface DetailsData {
  title: string;
  lines: string[];
}

export default function StoreScreen() {
  const player = usePlayerStore();
  const inventory = useInventoryStore();
  const locale = useLocaleStore((state) => state.locale);
  const pushUiNotification = useNotificationStore((state) => state.pushUiNotification);
  const [details, setDetails] = useState<DetailsData | null>(null);

  const tUi = (key: string, params?: Record<string, string | number>): string =>
    resolveLocalizedKey(locale, 'ui', `store_screen.${key}`, params);

  const tExtras = (key: string, params?: Record<string, string | number>): string =>
    resolveLocalizedKey(locale, 'extras', key, params);

  const effectLabels = {
    maxHealthPerYear: tExtras('effect_labels.maxHealthPerYear'),
    healthRegenPerYear: tExtras('effect_labels.healthRegenPerYear'),
    appearancePerYear: tExtras('effect_labels.appearancePerYear'),
    qiPerYear: tExtras('effect_labels.qiPerYear'),
    portalSuccessBps: tExtras('effect_labels.portalSuccessBps'),
    qiFlatPerYear: tExtras('effect_labels.qiFlatPerYear'),
    moneyFlatPerYear: tExtras('effect_labels.moneyFlatPerYear'),
    healthRegenFlat: tExtras('effect_labels.healthRegenFlat'),
    damageReductionBps: tExtras('effect_labels.damageReductionBps'),
    breakthroughChanceBps: tExtras('effect_labels.breakthroughChanceBps'),
    startMoney: tExtras('effect_labels.startMoney'),
    startMaxHealth: tExtras('effect_labels.startMaxHealth'),
    startSpiritualRoot: tExtras('effect_labels.startSpiritualRoot'),
    startBodyTempering: tExtras('effect_labels.startBodyTempering'),
  };

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

  const getItemName = (item: any): string => {
    const resolved = tUi(`items.${item.id}.name`);
    return resolved || item.id;
  };

  const getItemDesc = (item: any): string => {
    return tUi(`items.${item.id}.desc`);
  };

  const buildItemDetails = (item: any, currentLevel: number, safeMaxLevel: number): string[] => {
    const lines: string[] = [];

    const currentEffects = getKarmaLevelEffects(item.id, currentLevel);
    const currentLines = buildEffectLines(currentEffects, effectLabels, 1);

    if (currentLevel > 0 && currentLines.length > 0) {
      lines.push(tExtras('store.current_effects'));
      currentLines.forEach((line) => lines.push(line));
    }

    if (currentLevel < safeMaxLevel) {
      const nextLevel = Math.min(currentLevel + 1, safeMaxLevel);
      const nextEffects = getKarmaLevelEffects(item.id, nextLevel);
      const nextLines = buildEffectLines(nextEffects, effectLabels, 1);

      if (nextLines.length > 0) {
        lines.push(tExtras('store.next_effects'));
        nextLines.forEach((line) => lines.push(line));
      }
    }

    const effectsNote = tExtras('store.effects_note');
    if (effectsNote) {
      lines.push(effectsNote);
    }

    return lines;
  };

  const handleBuyLevel = (item: any) => {
    const itemName = getItemName(item);
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
      name: itemName,
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
        <Text style={styles.title}>{tUi('title')}</Text>

        <Card variant="gold" style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>{tUi('karma_balance')}</Text>
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
            const itemName = getItemName(item);
            const itemDesc = getItemDesc(item);

            return (
              <Card key={item.id} style={styles.itemCard}>
                <View style={styles.itemTopRow}>
                  <Text style={styles.itemName}>{itemName}</Text>
                  <Text style={styles.itemLevel}>
                    {tExtras('store.level')}: {currentLevel}/{safeMaxLevel}
                  </Text>
                </View>

                <Text style={styles.itemDesc}>{itemDesc}</Text>

                {!isMax ? (
                  <View style={styles.costRow}>
                    <Text style={styles.costLabel}>{tExtras('store.next_cost')}</Text>
                    <Text style={styles.costValue}>{formatLargeNumber(nextCost)}</Text>
                  </View>
                ) : null}

                <Button
                  title={
                    isMax
                      ? tExtras('store.max_level')
                      : canAfford
                        ? tUi('btn_buy')
                        : tUi('btn_no_karma')
                  }
                  onPress={() => handleBuyLevel(item)}
                  onLongPress={() =>
                    setDetails({
                      title: itemName,
                      lines: buildItemDetails(item, currentLevel, safeMaxLevel),
                    })
                  }
                  disabled={isMax || !canAfford}
                  variant={isMax ? 'secondary' : canAfford ? 'gold' : 'ghost'}
                  icon={isMax ? 'checkmark-circle' : 'cart'}
                  style={styles.itemButton}
                />
              </Card>
            );
          })}

        <Text style={styles.sectionTitle}>{tUi('iap_section')}</Text>

        <Card variant="primary" style={styles.iapCard}>
          <Text style={styles.iapName}>{tUi('iap_pass')}</Text>
          <Text style={styles.iapDesc}>{tUi('iap_pass_desc')}</Text>
          <Button
            title={player.hasCultivatorPass ? tUi('btn_iap_active') : tUi('btn_iap_buy')}
            onPress={handleBuyPass}
            disabled={player.hasCultivatorPass}
            variant={player.hasCultivatorPass ? 'secondary' : 'primary'}
            icon="ribbon"
            style={styles.iapButton}
          />
        </Card>

        <Card style={styles.iapCard}>
          <Text style={styles.iapName}>{tUi('iap_ad')}</Text>
          <Text style={styles.iapDesc}>{tUi('iap_ad_desc')}</Text>
          <Button
            title={tUi('btn_info')}
            onPress={() => undefined}
            disabled
            variant="ghost"
            icon="play-circle"
            style={styles.iapButton}
          />
        </Card>
      </ScrollView>

      <DetailsModal
        visible={details !== null}
        title={details?.title || ''}
        lines={details?.lines || []}
        closeLabel={tExtras('store.details_close')}
        onClose={() => setDetails(null)}
      />
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
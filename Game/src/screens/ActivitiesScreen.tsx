import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { usePlayerStore } from '../store/usePlayerStore';
import { useLifestyleStore } from '../store/useLifestyleStore';
import { useLocaleStore } from '../store/useLocaleStore';
import { useTechniquesStore } from '../store/useTechniquesStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { Button, Card } from '../components/ui';
import { Theme } from '../constants/Theme';
import { formatLargeNumber, safeBigInt } from '../utils/helpers';
import {
  getOptionById,
  meetsLifestyleRequirements,
  combineModifiers,
  getTechniqueModifiers,
  getKarmaTotalEffects,
  canAffordLifestyleOption,
  getLifestyleAnnualCost,
  getLifestyleAnnualIncome,
} from '../utils/gameplayUtils';
import { getCurseModifiers } from '../utils/rebirthUtils';
import { getStageName } from '../utils/stageUtils';
import { buildEffectLines, formatBpsPercent } from '../utils/effectFormatter';
import { resolveLocalizedKey } from '../utils/i18n';
import { LifestyleCategory } from '../types';
import lifestyleData from '../data/lifestyle.json';

const formatSignedMoney = (value: bigint): string => {
  const abs = value < 0n ? (-value).toString() : value.toString();
  return `${value < 0n ? '-' : '+'}$${formatLargeNumber(abs)}`;
};

export default function ActivitiesScreen() {
  const player = usePlayerStore();
  const lifestyle = useLifestyleStore();
  const locale = useLocaleStore((state) => state.locale);
  const techniques = useTechniquesStore();
  const inventory = useInventoryStore();
  const [expanded, setExpanded] = useState<string>('job');

  const tAct = (key: string, params?: Record<string, string | number>): string =>
    resolveLocalizedKey(locale, 'extras', `activities.${key}`, params);

  const tEffectLabel = (key: string): string =>
    resolveLocalizedKey(locale, 'extras', `effect_labels.${key}`);

  const effectLabels = {
    maxHealthPerYear: tEffectLabel('maxHealthPerYear'),
    healthRegenPerYear: tEffectLabel('healthRegenPerYear'),
    appearancePerYear: tEffectLabel('appearancePerYear'),
    qiPerYear: tEffectLabel('qiPerYear'),
    portalSuccessBps: tEffectLabel('portalSuccessBps'),
    qiFlatPerYear: tEffectLabel('qiFlatPerYear'),
    moneyFlatPerYear: tEffectLabel('moneyFlatPerYear'),
    healthRegenFlat: tEffectLabel('healthRegenFlat'),
    damageReductionBps: tEffectLabel('damageReductionBps'),
    breakthroughChanceBps: tEffectLabel('breakthroughChanceBps'),
    startMoney: tEffectLabel('startMoney'),
    startMaxHealth: tEffectLabel('startMaxHealth'),
    startSpiritualRoot: tEffectLabel('startSpiritualRoot'),
    startBodyTempering: tEffectLabel('startBodyTempering'),
  };

  const modifiers = combineModifiers(
    getTechniqueModifiers(techniques.levels || {}),
    getKarmaTotalEffects(inventory.items || {}),
    getCurseModifiers(player.activeCurses || [])
  );

  const toggleCategory = (categoryId: string) => {
    setExpanded((prev) => (prev === categoryId ? '' : categoryId));
  };

  const getOptionName = (optionId: string): string => {
    return tAct(`options.${optionId}.name`) || optionId;
  };

  const getOptionDesc = (optionId: string): string => {
    return tAct(`options.${optionId}.desc`);
  };

  const getRequirementText = (option: any): string => {
    const req = option.requirements;
    if (!req) {
      return '';
    }
    const parts: string[] = [];
    if (req.ageMin) {
      parts.push(`${tAct('requirements.age')}: ${req.ageMin}`);
    }
    if (req.intelligence) {
      parts.push(`${tAct('requirements.intelligence')}: ${req.intelligence}`);
    }
    if (req.appearance) {
      parts.push(`${tAct('requirements.appearance')}: ${req.appearance}`);
    }
    if (req.spiritualRoot) {
      parts.push(`${tAct('requirements.spiritual_root')}: ${req.spiritualRoot}`);
    }
    if (req.healthMin) {
      parts.push(`${tAct('requirements.health')}: ${req.healthMin}`);
    }
    if (req.maxHealthMin) {
      parts.push(`${tAct('requirements.max_health')}: ${req.maxHealthMin}`);
    }
    if (req.stage) {
      parts.push(`${tAct('requirements.stage')}: ${getStageName(req.stage, locale)}`);
    }
    return parts.join(', ');
  };

  if (player.isDead) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Card variant="danger" style={styles.deadCard}>
            <Text style={styles.deadText}>{tAct('dead_text')}</Text>
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{tAct('title')}</Text>
        <Card variant="gold" style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>{`$${formatLargeNumber(player.money)}`}</Text>
        </Card>
        {(lifestyleData as any).categories.map((category: any) => {
          const categoryKey = category.id as LifestyleCategory;
          const selectedId = lifestyle.selected[categoryKey];
          const selectedOption = getOptionById(selectedId);
          const isOpen = expanded === category.id;
          return (
            <Card key={category.id} style={styles.categoryCard}>
              <Button
                title={`${tAct(`categories.${category.id}`) || category.id} — ${
                  selectedOption ? getOptionName(selectedOption.id) : tAct('none')
                }`}
                onPress={() => toggleCategory(category.id)}
                variant="secondary"
                icon={isOpen ? 'chevron-up' : 'chevron-down'}
                style={styles.categoryButton}
              />
              {isOpen ? (
                <View style={styles.optionsContainer}>
                  {category.options.map((option: any) => {
                    const isSelected = selectedId === option.id;
                    const meets = meetsLifestyleRequirements(option, player);
                    const affordable = canAffordLifestyleOption(
                      categoryKey,
                      option.id,
                      lifestyle.selected,
                      player,
                      modifiers
                    );
                    const canSelect = meets && affordable;
                    const requirementText = getRequirementText(option);
                    const annualCost = getLifestyleAnnualCost(option);
                    const annualIncome = getLifestyleAnnualIncome(option, player, modifiers);
                    const net = annualIncome - annualCost;
                    const effectLines = buildEffectLines(option.effects, effectLabels, 1);
                    return (
                      <View key={option.id} style={styles.optionCard}>
                        <View style={styles.optionHeader}>
                          <Text style={styles.optionName}>{getOptionName(option.id)}</Text>
                          <Text style={styles.optionTier}>T{option.tier}</Text>
                        </View>
                        <Text style={styles.optionDesc}>{getOptionDesc(option.id)}</Text>
                        {annualCost > 0n ? (
                          <View style={styles.optionMetaRow}>
                            <Text style={styles.optionMetaLabel}>{tAct('yearly_cost')}</Text>
                            <Text style={styles.optionMetaValue}>
                              -${formatLargeNumber(annualCost.toString())}
                            </Text>
                          </View>
                        ) : null}
                        {annualIncome > 0n ? (
                          <View style={styles.optionMetaRow}>
                            <Text style={styles.optionMetaLabel}>{tAct('yearly_income')}</Text>
                            <Text style={[styles.optionMetaValue, styles.incomeValue]}>
                              +${formatLargeNumber(annualIncome.toString())}
                            </Text>
                          </View>
                        ) : null}
                        {annualCost > 0n || annualIncome > 0n ? (
                          <View style={styles.optionMetaRow}>
                            <Text style={styles.optionMetaLabel}>{tAct('net_yearly')}</Text>
                            <Text
                              style={[
                                styles.optionMetaValue,
                                net >= 0n ? styles.incomeValue : styles.expenseValue,
                              ]}
                            >
                              {formatSignedMoney(net)}
                            </Text>
                          </View>
                        ) : null}
                        {effectLines.length > 0 ? (
                          <View style={styles.effectsContainer}>
                            <Text style={styles.effectsTitle}>{tAct('effects_title')}</Text>
                            {effectLines.map((line, index) => (
                              <Text key={`${option.id}_effect_${index}`} style={styles.effectLine}>
                                {line}
                              </Text>
                            ))}
                          </View>
                        ) : null}
                        {option.category === 'portal' && option.portal ? (
                          <View style={styles.portalRewardsContainer}>
                            <Text style={styles.portalRewardsTitle}>
                              {tAct('portal_rewards.title')}
                            </Text>
                            {safeBigInt(option.portal.attemptCost || '0') > 0n ? (
                              <Text style={styles.portalRewardLine}>
                                {tAct('portal_rewards.attempt_cost', {
                                  cost: formatLargeNumber(option.portal.attemptCost),
                                })}
                              </Text>
                            ) : null}
                            {safeBigInt(option.portal.moneyMin || '0') > 0n &&
                            safeBigInt(option.portal.moneyMax || '0') > 0n ? (
                              <Text style={styles.portalRewardLine}>
                                {tAct('portal_rewards.reward_money', {
                                  min: formatLargeNumber(option.portal.moneyMin),
                                  max: formatLargeNumber(option.portal.moneyMax),
                                })}
                              </Text>
                            ) : null}
                            {safeBigInt(option.portal.qiMin || '0') > 0n &&
                            safeBigInt(option.portal.qiMax || '0') > 0n ? (
                              <Text style={styles.portalRewardLine}>
                                {tAct('portal_rewards.reward_qi', {
                                  min: formatLargeNumber(option.portal.qiMin),
                                  max: formatLargeNumber(option.portal.qiMax),
                                })}
                              </Text>
                            ) : null}
                            {typeof option.portal.breakthroughBlessingBps === 'number' &&
                            option.portal.breakthroughBlessingBps > 0 ? (
                              <Text style={styles.portalRewardLine}>
                                {tAct('portal_rewards.breakthrough_bonus', {
                                  percent: formatBpsPercent(option.portal.breakthroughBlessingBps),
                                })}
                              </Text>
                            ) : null}
                            {typeof option.portal.failDamageBps === 'number' &&
                            option.portal.failDamageBps > 0 ? (
                              <Text style={styles.portalDangerLine}>
                                {tAct('portal_rewards.fail_damage_bps', {
                                  percent: formatBpsPercent(option.portal.failDamageBps),
                                })}
                              </Text>
                            ) : null}
                            {safeBigInt(option.portal.failDamage || '0') > 0n ? (
                              <Text style={styles.portalDangerLine}>
                                {tAct('portal_rewards.fail_damage_flat', {
                                  damage: formatLargeNumber(option.portal.failDamage),
                                })}
                              </Text>
                            ) : null}
                          </View>
                        ) : null}
                        {!!requirementText ? (
                          <Text style={styles.requirementText}>
                            {tAct('requirements_label')}: {requirementText}
                          </Text>
                        ) : null}
                        {isSelected ? (
                          <View style={styles.optionButtonRow}>
                            <Button
                              title={tAct('selected')}
                              onPress={() => undefined}
                              disabled
                              variant="secondary"
                              small
                              style={styles.optionButton}
                            />
                            {option.id !== `${category.id}_none` ? (
                              <Button
                                title={tAct('disable')}
                                onPress={() => lifestyle.disableOption(categoryKey)}
                                variant="danger"
                                small
                                style={[styles.optionButton, styles.optionButtonRight]}
                              />
                            ) : null}
                          </View>
                        ) : (
                          <Button
                            title={canSelect ? tAct('select') : tAct('locked')}
                            onPress={() => {
                              if (canSelect) {
                                lifestyle.selectOption(categoryKey, option.id);
                              }
                            }}
                            disabled={!canSelect}
                            variant={canSelect ? 'primary' : 'ghost'}
                            small
                            style={styles.optionButton}
                          />
                        )}
                      </View>
                    );
                  })}
                </View>
              ) : null}
            </Card>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.md,
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
    color: Theme.colors.gold,
    fontSize: 30,
    fontWeight: '900',
  },
  categoryCard: {
    marginBottom: Theme.spacing.md,
  },
  categoryButton: {
    alignSelf: 'stretch',
  },
  optionsContainer: {
    marginTop: Theme.spacing.sm,
  },
  optionCard: {
    backgroundColor: Theme.colors.surfaceLight,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    padding: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  optionName: {
    color: Theme.colors.text,
    fontWeight: '900',
    flex: 1,
  },
  optionTier: {
    color: Theme.colors.textDim,
    fontWeight: '800',
    marginLeft: 8,
  },
  optionDesc: {
    color: Theme.colors.textMuted,
    fontSize: Theme.fontSize.sm,
    marginBottom: 8,
  },
  optionMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  optionMetaLabel: {
    color: Theme.colors.textMuted,
    fontSize: Theme.fontSize.sm,
  },
  optionMetaValue: {
    color: Theme.colors.text,
    fontWeight: '800',
  },
  incomeValue: {
    color: Theme.colors.success,
  },
  expenseValue: {
    color: Theme.colors.danger,
  },
  effectsContainer: {
    marginTop: 6,
    marginBottom: 6,
  },
  effectsTitle: {
    color: Theme.colors.textDim,
    fontSize: Theme.fontSize.xs,
    marginBottom: 2,
  },
  effectLine: {
    color: Theme.colors.secondary,
    fontSize: Theme.fontSize.xs,
    marginBottom: 2,
  },
  portalRewardsContainer: {
    marginTop: 6,
    marginBottom: 6,
  },
  portalRewardsTitle: {
    color: Theme.colors.textDim,
    fontSize: Theme.fontSize.xs,
    fontWeight: '800',
    marginBottom: 2,
  },
  portalRewardLine: {
    color: Theme.colors.info,
    fontSize: Theme.fontSize.xs,
    marginBottom: 2,
  },
  portalDangerLine: {
    color: Theme.colors.danger,
    fontSize: Theme.fontSize.xs,
    marginBottom: 2,
  },
  requirementText: {
    color: Theme.colors.warning,
    fontSize: Theme.fontSize.xs,
    marginTop: 4,
    marginBottom: 8,
  },
  optionButtonRow: {
    flexDirection: 'row',
  },
  optionButton: {
    flex: 1,
    marginTop: 4,
  },
  optionButtonRight: {
    marginLeft: 8,
  },
  deadCard: {
    width: '100%',
    alignItems: 'center',
  },
  deadText: {
    color: Theme.colors.danger,
    fontSize: Theme.fontSize.lg,
    fontWeight: '900',
    textAlign: 'center',
  },
});
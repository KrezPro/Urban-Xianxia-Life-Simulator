import React, { useState } from 'react';
import { SafeAreaView, Text, View, StyleSheet, ScrollView, Alert } from 'react-native';
import { usePlayerStore } from '../store/usePlayerStore';
import { useTechniquesStore } from '../store/useTechniquesStore';
import { useBreakthrough } from '../hooks/useBreakthrough';
import { useLocaleStore } from '../store/useLocaleStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { Button, Card, ProgressBar } from '../components/ui';
import { NotificationHost } from '../components/game/NotificationHost';
import { Theme } from '../constants/Theme';
import { GameConstants } from '../constants/GameConstants';
import { formatLargeNumber, getBigIntProgress, isGreaterOrEqualBigInt } from '../utils/helpers';
import {
  getTechniqueCost,
  meetsTechniqueRequirements,
  getBodyTemperCost,
  getBodyTemperMoneyCost,
  getBodyEffects,
} from '../utils/gameplayUtils';
import { getStageName } from '../utils/stageUtils';
import { buildEffectLines } from '../utils/effectFormatter';
import techniquesData from '../data/techniques.json';
import ruUI from '../locales/ru/ui.json';
import enUI from '../locales/en/ui.json';
import ruExtras from '../locales/ru/extras.json';
import enExtras from '../locales/en/extras.json';

export default function DaoScreen() {
  const player = usePlayerStore();
  const techniques = useTechniquesStore();
  const locale = useLocaleStore((state) => state.locale);
  const pushUiNotification = useNotificationStore((state) => state.pushUiNotification);
  const { attemptBreakthrough, nextStage, calculateChance, nextStageName } = useBreakthrough();
  const [hasAdBuff, setHasAdBuff] = useState(false);

  const ui: any = locale === 'ru' ? ruUI.dao_screen : enUI.dao_screen;
  const extras: any = locale === 'ru' ? ruExtras : enExtras;
  const techniquesUI = extras.dao?.techniques || {};
  const effectLabels = extras.effect_labels || {};

  const currentStageName = getStageName(player.cultivationStage, locale);
  const chance = calculateChance(hasAdBuff);
  const chancePercent = Math.floor(chance * 100);
  const progress = nextStage ? getBigIntProgress(player.qi, nextStage.requiredQi) : 1;
  const canBreakthrough = nextStage !== undefined && progress >= 1;

  const bodyLevel = player.bodyTempering || 0;
  const bodyCost = getBodyTemperCost(bodyLevel);
  const bodyMoneyCost = getBodyTemperMoneyCost(bodyLevel);
  const bodyEffects = getBodyEffects(bodyLevel);

  const bodyOldEnough = player.age >= GameConstants.BODY_TEMPERING.MIN_AGE;
  const bodyAlreadyThisYear = player.lastBodyTemperAge === player.age;
  const bodyEnoughQi = isGreaterOrEqualBigInt(player.qi, bodyCost.toString());
  const bodyEnoughMoney = isGreaterOrEqualBigInt(player.money, bodyMoneyCost.toString());

  const canTemperBody =
    !player.isDead &&
    bodyOldEnough &&
    !bodyAlreadyThisYear &&
    bodyEnoughQi &&
    bodyEnoughMoney;

  const bodyButtonTitle = !bodyOldEnough
    ? ui.body_locked_age
    : bodyAlreadyThisYear
      ? ui.body_locked_year
      : !bodyEnoughQi
        ? ui.body_locked_qi
        : !bodyEnoughMoney
          ? techniquesUI.not_enough_money
          : ui.body_button;

  const bodyEffectText = (ui.body_effect_line || '')
    .replace('{maxHealth}', bodyEffects.maxHealth.toString())
    .replace('{regen}', bodyEffects.regenPerYear.toString())
    .replace('{resistance}', (bodyEffects.illnessResistanceBps / 100).toFixed(1));

  const bodyCostText = `${formatLargeNumber(bodyCost.toString())} ${ui.qi_energy} / $${formatLargeNumber(
    bodyMoneyCost.toString()
  )}`;

  const handleWatchAd = () => {
    setHasAdBuff(true);
    Alert.alert(ui.alert_ad_title, ui.alert_ad_msg);
  };

  const handleBreakthrough = () => {
    attemptBreakthrough(hasAdBuff, () => setHasAdBuff(false));
  };

  const handleTemperBody = () => {
    if (!canTemperBody) {
      return;
    }

    const nextLevel = bodyLevel + 1;
    const success = player.temperBody();

    if (success) {
      pushUiNotification('body_temper_success', 'reward', {
        level: nextLevel.toString(),
      });
    } else {
      pushUiNotification('technique_upgrade_error', 'danger');
    }
  };

  const getTechniqueName = (techniqueId: string): string => {
    return techniquesUI.items?.[techniqueId]?.name || techniqueId;
  };

  const getTechniqueDesc = (techniqueId: string): string => {
    return techniquesUI.items?.[techniqueId]?.desc || '';
  };

  const getRequirementText = (technique: any): string => {
    const parts: string[] = [];

    if (technique.requiredSpiritualRoot) {
      parts.push(`${techniquesUI.requirements?.spiritual_root}: ${technique.requiredSpiritualRoot}`);
    }
    if (technique.requiredIntelligence) {
      parts.push(`${techniquesUI.requirements?.intelligence}: ${technique.requiredIntelligence}`);
    }
    if (technique.requiredStage) {
      parts.push(`${techniquesUI.requirements?.stage}: ${getStageName(technique.requiredStage, locale)}`);
    }

    return parts.join(', ');
  };

  const handleUpgradeTechnique = (technique: any) => {
    const currentLevel = techniques.levels?.[technique.id] || 0;
    const cost = getTechniqueCost(technique.id, currentLevel);
    const meets = meetsTechniqueRequirements(technique.id, player);
    const canAfford = isGreaterOrEqualBigInt(player.money, cost);
    const isMax = currentLevel >= technique.maxLevel;

    if (isMax || !meets || !canAfford) {
      pushUiNotification('technique_upgrade_error', 'danger');
      return;
    }

    player.applyEffects({ money: `-${cost}` });
    techniques.incrementTechnique(technique.id);

    pushUiNotification('technique_upgrade_success', 'reward', {
      name: getTechniqueName(technique.id),
      level: (currentLevel + 1).toString(),
    });
  };

  const safeTechniques = Array.isArray(techniquesData) ? techniquesData : [];

  if (player.isDead) {
    return (
      <SafeAreaView style={styles.container}>
        <NotificationHost />
        <View style={styles.centerContainer}>
          <Card variant="danger" style={styles.deadCard}>
            <Text style={styles.deadText}>{ui.dead_text}</Text>
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <NotificationHost />

      <View style={styles.header}>
        <Text style={styles.title}>{ui.title}</Text>

        <Card variant="primary" style={styles.stageCard}>
          <Text style={styles.stageLabel}>{ui.stage}</Text>
          <Text style={styles.stageName}>{currentStageName}</Text>
          <Text style={styles.qiValue}>
            {ui.qi_energy}: {formatLargeNumber(player.qi)}
          </Text>
          <ProgressBar progress={progress} color={Theme.colors.info} height={14} style={styles.progress} />
        </Card>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {nextStage ? (
          <Card style={styles.nextCard}>
            <Text style={styles.nextStageTitle}>{ui.next_stage}</Text>
            <Text style={styles.nextStageName}>{nextStageName}</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{ui.req_qi}</Text>
              <Text style={styles.infoValue}>{formatLargeNumber(nextStage.requiredQi)}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{ui.success_chance}</Text>
              <Text style={[styles.infoValue, { color: Theme.colors.success }]}>{chancePercent}%</Text>
            </View>

            {!player.hasCultivatorPass ? (
              <Button
                title={hasAdBuff ? ui.btn_ad_watched : ui.btn_ad_buff}
                onPress={handleWatchAd}
                disabled={hasAdBuff}
                variant="gold"
                icon="play-circle"
                style={styles.adButton}
              />
            ) : null}
          </Card>
        ) : (
          <Card variant="gold" style={styles.maxCard}>
            <Text style={styles.maxStageText}>{ui.max_stage}</Text>
          </Card>
        )}

        <Card variant="primary" style={styles.bodyCard}>
          <View style={styles.techniqueHeader}>
            <Text style={styles.techniqueName}>{ui.body_title}</Text>
            <Text style={styles.techniqueLevel}>
              {ui.body_level}: {bodyLevel}
            </Text>
          </View>

          <Text style={styles.techniqueDesc}>{bodyEffectText}</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{ui.body_cost}</Text>
            <Text style={styles.infoValue}>{bodyCostText}</Text>
          </View>

          <Button
            title={bodyButtonTitle}
            onPress={handleTemperBody}
            disabled={!canTemperBody}
            variant={canTemperBody ? 'primary' : 'ghost'}
            icon="barbell"
            style={styles.techniqueButton}
          />
        </Card>

        <Text style={styles.sectionTitle}>{techniquesUI.title}</Text>

        {safeTechniques.map((technique: any) => {
          const currentLevel = techniques.levels?.[technique.id] || 0;
          const isMax = currentLevel >= technique.maxLevel;
          const meets = meetsTechniqueRequirements(technique.id, player);
          const cost = getTechniqueCost(technique.id, currentLevel);
          const canAfford = isGreaterOrEqualBigInt(player.money, cost);
          const requirementText = getRequirementText(technique);

          const currentLines = buildEffectLines(technique.effectsPerLevel, effectLabels, currentLevel);
          const nextLines = !isMax
            ? buildEffectLines(technique.effectsPerLevel, effectLabels, currentLevel + 1)
            : [];

          let buttonTitle = techniquesUI.upgrade;

          if (isMax) {
            buttonTitle = techniquesUI.max;
          } else if (!meets) {
            buttonTitle = techniquesUI.locked;
          } else if (!canAfford) {
            buttonTitle = techniquesUI.not_enough_money;
          }

          return (
            <Card key={technique.id} style={styles.techniqueCard}>
              <View style={styles.techniqueHeader}>
                <Text style={styles.techniqueName}>{getTechniqueName(technique.id)}</Text>
                <Text style={styles.techniqueLevel}>
                  {techniquesUI.level}: {currentLevel}/{technique.maxLevel}
                </Text>
              </View>

              <Text style={styles.techniqueDesc}>{getTechniqueDesc(technique.id)}</Text>

              {!!requirementText ? (
                <Text style={styles.techniqueRequirement}>{requirementText}</Text>
              ) : null}

              {currentLines.length > 0 ? (
                <View style={styles.effectsBlock}>
                  <Text style={styles.effectsLabel}>{techniquesUI.current_effects}</Text>
                  {currentLines.map((line, index) => (
                    <Text key={`${technique.id}_current_${index}`} style={styles.effectLine}>
                      {line}
                    </Text>
                  ))}
                </View>
              ) : null}

              {!isMax && nextLines.length > 0 ? (
                <View style={styles.effectsBlock}>
                  <Text style={styles.effectsLabel}>{techniquesUI.next_effects}</Text>
                  {nextLines.map((line, index) => (
                    <Text key={`${technique.id}_next_${index}`} style={styles.effectLine}>
                      {line}
                    </Text>
                  ))}
                </View>
              ) : null}

              {!isMax ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{techniquesUI.cost}</Text>
                  <Text style={styles.infoValue}>${formatLargeNumber(cost)}</Text>
                </View>
              ) : null}

              <Button
                title={buttonTitle}
                onPress={() => handleUpgradeTechnique(technique)}
                disabled={isMax || !meets || !canAfford}
                variant={isMax ? 'secondary' : meets && canAfford ? 'gold' : 'ghost'}
                icon="sparkles"
                style={styles.techniqueButton}
              />
            </Card>
          );
        })}
      </ScrollView>

      {nextStage ? (
        <View style={styles.bottomBar}>
          <Card variant="primary" style={styles.bottomCard}>
            <View style={styles.bottomInfoRow}>
              <Text style={styles.bottomLabel}>{ui.req_qi}</Text>
              <Text style={styles.bottomValue}>{formatLargeNumber(nextStage.requiredQi)}</Text>
            </View>

            <Button
              title={canBreakthrough ? ui.btn_breakthrough : ui.btn_no_qi}
              onPress={handleBreakthrough}
              disabled={!canBreakthrough}
              variant="primary"
              icon="flash"
              style={styles.breakthroughButton}
            />
          </Card>
        </View>
      ) : null}
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
  header: {
    padding: Theme.spacing.md,
    paddingBottom: 0,
  },
  content: {
    padding: Theme.spacing.md,
    paddingBottom: 140,
  },
  title: {
    fontSize: Theme.fontSize.xl,
    fontWeight: '900',
    color: Theme.colors.text,
    textAlign: 'center',
    marginBottom: Theme.spacing.md,
    letterSpacing: 1,
  },
  stageCard: {
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  stageLabel: {
    color: Theme.colors.textMuted,
    marginBottom: 4,
  },
  stageName: {
    color: Theme.colors.info,
    fontSize: 30,
    fontWeight: '900',
    marginBottom: Theme.spacing.sm,
  },
  qiValue: {
    color: Theme.colors.text,
    fontSize: Theme.fontSize.md,
    fontWeight: '700',
    marginBottom: Theme.spacing.sm,
  },
  progress: {
    marginTop: Theme.spacing.xs,
  },
  nextCard: {
    marginBottom: Theme.spacing.md,
  },
  nextStageTitle: {
    color: Theme.colors.textMuted,
    marginBottom: 4,
  },
  nextStageName: {
    color: Theme.colors.text,
    fontSize: 24,
    fontWeight: '900',
    marginBottom: Theme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.borderSoft,
  },
  infoLabel: {
    color: Theme.colors.textMuted,
  },
  infoValue: {
    color: Theme.colors.text,
    fontWeight: '800',
  },
  adButton: {
    marginTop: Theme.spacing.md,
  },
  maxCard: {
    alignItems: 'center',
  },
  maxStageText: {
    color: Theme.colors.gold,
    fontSize: Theme.fontSize.lg,
    fontWeight: '800',
    textAlign: 'center',
  },
  deadCard: {
    width: '100%',
    alignItems: 'center',
  },
  deadText: {
    color: Theme.colors.danger,
    fontSize: Theme.fontSize.lg,
    fontWeight: '900',
  },
  sectionTitle: {
    color: Theme.colors.text,
    fontSize: 22,
    fontWeight: '900',
    marginTop: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  bodyCard: {
    marginBottom: Theme.spacing.md,
  },
  techniqueCard: {
    marginBottom: Theme.spacing.md,
  },
  techniqueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  techniqueName: {
    color: Theme.colors.secondary,
    fontSize: 18,
    fontWeight: '900',
    flex: 1,
  },
  techniqueLevel: {
    color: Theme.colors.textMuted,
    fontWeight: '800',
    marginLeft: 8,
  },
  techniqueDesc: {
    color: Theme.colors.textMuted,
    marginBottom: 8,
  },
  techniqueRequirement: {
    color: Theme.colors.warning,
    fontSize: Theme.fontSize.sm,
    marginBottom: 8,
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
  techniqueButton: {
    marginTop: Theme.spacing.sm,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: Theme.spacing.md,
    backgroundColor: Theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.borderSoft,
  },
  bottomCard: {
    marginBottom: 0,
  },
  bottomInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.sm,
  },
  bottomLabel: {
    color: Theme.colors.textMuted,
  },
  bottomValue: {
    color: Theme.colors.text,
    fontWeight: '800',
  },
  breakthroughButton: {
    minHeight: 56,
    justifyContent: 'center',
  },
});
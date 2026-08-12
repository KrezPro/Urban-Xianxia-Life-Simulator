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
import { formatLargeNumber, getBigIntProgress, isGreaterOrEqualBigInt } from '../utils/helpers';
import {
  getTechniqueCost,
  meetsTechniqueRequirements,
} from '../utils/gameplayUtils';
import stagesData from '../data/stages.json';
import techniquesData from '../data/techniques.json';
import ruUI from '../locales/ru/ui.json';
import enUI from '../locales/en/ui.json';
import ruDao from '../locales/ru/dao.json';
import enDao from '../locales/en/dao.json';

export default function DaoScreen() {
  const player = usePlayerStore();
  const techniques = useTechniquesStore();
  const locale = useLocaleStore((state) => state.locale);
  const pushUiNotification = useNotificationStore((state) => state.pushUiNotification);
  const { attemptBreakthrough, nextStage, calculateChance } = useBreakthrough();
  const [hasAdBuff, setHasAdBuff] = useState(false);

  const ui: any = locale === 'ru' ? ruUI.dao_screen : enUI.dao_screen;
  const daoExtra: any = locale === 'ru' ? ruDao.dao_screen : enDao.dao_screen;
  const techniquesUI: any = daoExtra?.techniques || {};

  const currentStage = stagesData.find((stage) => stage.id === player.cultivationStage);
  const chance = calculateChance(hasAdBuff);
  const chancePercent = Math.floor(chance * 100);
  const progress = nextStage ? getBigIntProgress(player.qi, nextStage.requiredQi) : 1;
  const canBreakthrough = nextStage !== undefined && progress >= 1;

  const handleWatchAd = () => {
    setHasAdBuff(true);
    Alert.alert(ui.alert_ad_title, ui.alert_ad_msg);
  };

  const handleBreakthrough = () => {
    attemptBreakthrough(hasAdBuff, () => setHasAdBuff(false));
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
      const stage = stagesData.find((s) => s.id === technique.requiredStage);
      parts.push(`${techniquesUI.requirements?.stage}: ${stage?.name || technique.requiredStage}`);
    }

    return parts.join(', ');
  };

  const handleUpgradeTechnique = (technique: any) => {
    const currentLevel = techniques.levels[technique.id] || 0;
    const cost = getTechniqueCost(technique, currentLevel);
    const meets = meetsTechniqueRequirements(technique, player);
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
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{ui.title}</Text>

        <Card variant="primary" style={styles.stageCard}>
          <Text style={styles.stageLabel}>{ui.stage}</Text>
          <Text style={styles.stageName}>{currentStage?.name || ui.unknown}</Text>
          <Text style={styles.qiValue}>
            {ui.qi_energy}: {formatLargeNumber(player.qi)}
          </Text>
          <ProgressBar progress={progress} color={Theme.colors.info} height={14} style={styles.progress} />
        </Card>

        {nextStage ? (
          <Card style={styles.nextCard}>
            <Text style={styles.nextStageTitle}>{ui.next_stage}</Text>
            <Text style={styles.nextStageName}>{nextStage.name}</Text>

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

            <Button
              title={canBreakthrough ? ui.btn_breakthrough : ui.btn_no_qi}
              onPress={handleBreakthrough}
              disabled={!canBreakthrough}
              variant="primary"
              icon="flash"
              style={styles.breakthroughButton}
            />
          </Card>
        ) : (
          <Card variant="gold" style={styles.maxCard}>
            <Text style={styles.maxStageText}>{ui.max_stage}</Text>
          </Card>
        )}

        <Text style={styles.sectionTitle}>{techniquesUI.title}</Text>

        {(techniquesData as any[]).map((technique) => {
          const currentLevel = techniques.levels[technique.id] || 0;
          const isMax = currentLevel >= technique.maxLevel;
          const meets = meetsTechniqueRequirements(technique, player);
          const cost = getTechniqueCost(technique, currentLevel);
          const canAfford = isGreaterOrEqualBigInt(player.money, cost);
          const requirementText = getRequirementText(technique);

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
  breakthroughButton: {
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
  techniqueButton: {
    marginTop: Theme.spacing.sm,
  },
});
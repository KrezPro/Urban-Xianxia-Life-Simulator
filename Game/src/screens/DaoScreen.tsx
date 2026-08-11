import React, { useState } from 'react';
import { SafeAreaView, Text, View, StyleSheet, ScrollView, Alert } from 'react-native';
import { usePlayerStore } from '../store/usePlayerStore';
import { useBreakthrough } from '../hooks/useBreakthrough';
import { useLocaleStore } from '../store/useLocaleStore';
import { Button, Card, ProgressBar } from '../components/ui';
import { Theme } from '../constants/Theme';
import { formatLargeNumber, getBigIntProgress } from '../utils/helpers';
import stagesData from '../data/stages.json';
import ruUI from '../locales/ru/ui.json';
import enUI from '../locales/en/ui.json';

export default function DaoScreen() {
  const player = usePlayerStore();
  const locale = useLocaleStore((state) => state.locale);
  const { attemptBreakthrough, nextStage, calculateChance } = useBreakthrough();
  const [hasAdBuff, setHasAdBuff] = useState(false);

  const ui: any = locale === 'ru' ? ruUI.dao_screen : enUI.dao_screen;
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

  if (player.isDead) {
    return (
      <SafeAreaView style={styles.container}>
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
});
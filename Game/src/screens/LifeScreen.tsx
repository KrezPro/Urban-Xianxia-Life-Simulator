import React, { useEffect } from 'react';
import { SafeAreaView, Text, View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { usePlayerStore } from '../store/usePlayerStore';
import { useLocaleStore } from '../store/useLocaleStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { Button, Card, ProgressBar, StatRow } from '../components/ui';
import { NotificationHost } from '../components/game/NotificationHost';
import { Theme } from '../constants/Theme';
import { formatLargeNumber, getBigIntProgress } from '../utils/helpers';
import { GameConstants } from '../constants/GameConstants';
import stagesData from '../data/stages.json';
import ruEvents from '../locales/ru/events.json';
import enEvents from '../locales/en/events.json';
import ruUI from '../locales/ru/ui.json';
import enUI from '../locales/en/ui.json';

export default function LifeScreen() {
  const player = usePlayerStore();
  const { locale, toggleLocale } = useLocaleStore();
  const pushUiNotification = useNotificationStore((state) => state.pushUiNotification);
  const pushEventNotification = useNotificationStore((state) => state.pushEventNotification);

  const eventsData: any = locale === 'ru' ? ruEvents : enEvents;
  const ui: any = locale === 'ru' ? ruUI.life_screen : enUI.life_screen;

  useEffect(() => {
    if (player.age === 0 && player.money === '0' && player.health === 100 && player.qi === '0' && !player.isDead) {
      player.reincarnate();
      pushUiNotification('born', 'system');
    }
  }, []);

  const foundStageIndex = stagesData.findIndex((stage) => stage.id === player.cultivationStage);
  const currentStageIndex = 0 > foundStageIndex ? 0 : foundStageIndex;
  const nextStage = stagesData[currentStageIndex + 1];

  const qiProgress = nextStage ? getBigIntProgress(player.qi, nextStage.requiredQi) : 1;
  const healthProgress = player.health / 100;

  const handleGrowOlder = () => {
    const now = Date.now();

    if (!player.hasCultivatorPass) {
      if (now - player.lastInterstitialTime > GameConstants.AD_INTERSTITIAL_COOLDOWN_MS) {
        player.setLastInterstitialTime(now);
      }
    }

    player.growOlder();

    let secretEventChance = 0.1;

    if (player.activityFocus === 'secret') {
      secretEventChance = 0.8;
      player.addQi(player.spiritualRoot.toString());
    }

    const isSecretEvent = secretEventChance > Math.random();
    const eventPool = isSecretEvent ? eventsData.secret : eventsData.mundane;
    const randomEvent = eventPool[Math.floor(Math.random() * eventPool.length)];

    player.applyEffects(randomEvent.effects);

    pushEventNotification(
      randomEvent.id,
      isSecretEvent ? 'secret' : 'mundane',
      isSecretEvent ? 'secret' : 'mundane'
    );
  };

  const handleReincarnate = () => {
    player.reincarnate();
    pushUiNotification('reincarnate', 'system');
  };

  if (player.isDead) {
    return (
      <SafeAreaView style={styles.container}>
        <NotificationHost />

        <ScrollView contentContainerStyle={styles.deadScrollContent}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{ui.title}</Text>
            <TouchableOpacity style={styles.langChip} onPress={toggleLocale}>
              <Text style={styles.langChipText}>{locale.toUpperCase()}</Text>
            </TouchableOpacity>
          </View>

          <Card variant="danger" style={styles.deadCard}>
            <Text style={styles.deadTitle}>{ui.dead_title}</Text>
            <Text style={styles.deadSubtitle}>{ui.dead_subtitle}</Text>

            <View style={styles.karmaRow}>
              <Text style={styles.karmaLabel}>{ui.karma_earned_last_life}</Text>
              <Text style={styles.karmaValue}>+{formatLargeNumber(player.lastLifeKarmaEarned)}</Text>
            </View>

            <View style={styles.karmaRow}>
              <Text style={styles.karmaLabel}>{ui.karma_accumulated}</Text>
              <Text style={styles.karmaValue}>{formatLargeNumber(player.karma)}</Text>
            </View>

            <Button
              title={ui.btn_reincarnate}
              onPress={handleReincarnate}
              variant="danger"
              icon="refresh"
              style={styles.reincarnateButton}
            />
          </Card>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <NotificationHost />

      <View style={styles.statusHeader}>
        <View style={styles.statusTopRow}>
          <View style={styles.ageBlock}>
            <Text style={styles.ageLabel}>{ui.age}</Text>
            <Text style={styles.ageValue}>{player.age}</Text>
          </View>

          <TouchableOpacity style={styles.langChip} onPress={toggleLocale}>
            <Text style={styles.langChipText}>{locale.toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        <ProgressBar progress={healthProgress} color={Theme.colors.success} height={10} />
        <Text style={styles.barLabel}>
          {ui.health}: {player.health}/100
        </Text>

        <ProgressBar progress={qiProgress} color={Theme.colors.info} height={10} style={styles.qiBar} />
        <Text style={styles.barLabel}>
          {ui.qi}: {formatLargeNumber(player.qi)}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.statsCard}>
          <StatRow
            icon="school"
            label={ui.intelligence}
            value={player.intelligence.toString()}
            color={Theme.colors.secondary}
          />
          <StatRow
            icon="diamond"
            label={ui.appearance}
            value={player.appearance.toString()}
            color={Theme.colors.warning}
          />
          <StatRow
            icon="cash"
            label={ui.money}
            value={`$${formatLargeNumber(player.money)}`}
            color={Theme.colors.gold}
          />
          <StatRow
            icon="flame"
            label={ui.spiritual_root}
            value={player.spiritualRoot.toString()}
            color={Theme.colors.info}
          />
          <StatRow
            icon="sparkles"
            label={ui.karma}
            value={formatLargeNumber(player.karma)}
            color={Theme.colors.primarySoft}
          />
        </Card>

        <Card style={styles.focusCard}>
          <Text style={styles.focusTitle}>{ui.focus_title}</Text>

          <View style={styles.focusRow}>
            <TouchableOpacity
              style={[
                styles.focusChip,
                styles.focusChipLeft,
                player.activityFocus === 'mundane' && styles.focusChipActiveMundane,
              ]}
              onPress={() => player.setActivityFocus('mundane')}
            >
              <Text
                style={[
                  styles.focusChipText,
                  player.activityFocus === 'mundane' && styles.focusChipTextActive,
                ]}
              >
                {ui.focus_mundane}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.focusChip,
                player.activityFocus === 'secret' && styles.focusChipActiveSecret,
              ]}
              onPress={() => player.setActivityFocus('secret')}
            >
              <Text
                style={[
                  styles.focusChipText,
                  player.activityFocus === 'secret' && styles.focusChipTextActive,
                ]}
              >
                {ui.focus_secret}
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        <Button
          title={ui.btn_grow}
          onPress={handleGrowOlder}
          variant="primary"
          icon="hourglass"
          style={styles.mainActionButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  deadScrollContent: {
    flexGrow: 1,
    padding: Theme.spacing.md,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  title: {
    fontSize: Theme.fontSize.xl,
    fontWeight: '900',
    color: Theme.colors.text,
    letterSpacing: 1,
  },
  langChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Theme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: Theme.colors.secondary,
  },
  langChipText: {
    color: Theme.colors.text,
    fontWeight: '800',
  },
  statusHeader: {
    backgroundColor: Theme.colors.surface,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Theme.colors.borderSoft,
    paddingHorizontal: Theme.spacing.md,
    paddingTop: Theme.spacing.sm,
    paddingBottom: Theme.spacing.md,
    ...Theme.shadow,
  },
  statusTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  ageBlock: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  ageLabel: {
    color: Theme.colors.textMuted,
    fontSize: Theme.fontSize.sm,
    fontWeight: '700',
  },
  ageValue: {
    color: Theme.colors.text,
    fontSize: 34,
    fontWeight: '900',
  },
  barLabel: {
    color: Theme.colors.textMuted,
    fontSize: Theme.fontSize.xs,
    marginTop: 4,
    marginBottom: 6,
  },
  qiBar: {
    marginTop: 2,
  },
  scrollContent: {
    padding: Theme.spacing.md,
    paddingBottom: 32,
  },
  statsCard: {
    marginBottom: Theme.spacing.md,
  },
  focusCard: {
    marginBottom: Theme.spacing.md,
  },
  focusTitle: {
    color: Theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: Theme.spacing.sm,
  },
  focusRow: {
    flexDirection: 'row',
  },
  focusChip: {
    flex: 1,
    borderRadius: Theme.radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
  },
  focusChipLeft: {
    marginRight: 10,
  },
  focusChipActiveMundane: {
    borderColor: Theme.colors.secondary,
    backgroundColor: 'rgba(56, 189, 248, 0.16)',
  },
  focusChipActiveSecret: {
    borderColor: Theme.colors.primarySoft,
    backgroundColor: 'rgba(168, 85, 247, 0.18)',
  },
  focusChipText: {
    color: Theme.colors.textDim,
    fontWeight: '800',
  },
  focusChipTextActive: {
    color: Theme.colors.text,
  },
  mainActionButton: {
    marginTop: Theme.spacing.sm,
  },
  deadCard: {
    alignItems: 'center',
    marginTop: Theme.spacing.xl,
  },
  deadTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: Theme.colors.danger,
    marginBottom: 8,
  },
  deadSubtitle: {
    color: Theme.colors.textMuted,
    marginBottom: Theme.spacing.lg,
  },
  karmaRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  karmaLabel: {
    color: Theme.colors.textMuted,
  },
  karmaValue: {
    color: Theme.colors.gold,
    fontWeight: '900',
  },
  reincarnateButton: {
    marginTop: Theme.spacing.md,
    width: '100%',
  },
});
import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlayerStore } from '../store/usePlayerStore';
import { useEventStore } from '../store/useEventStore';
import { useLocaleStore } from '../store/useLocaleStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { Button, Card, ProgressBar, StatRow } from '../components/ui';
import { Theme } from '../constants/Theme';
import { formatLargeNumber, getBigIntProgress } from '../utils/helpers';
import { GameConstants } from '../constants/GameConstants';
import stagesData from '../data/stages.json';
import ruEvents from '../locales/ru/events.json';
import enEvents from '../locales/en/events.json';
import ruUI from '../locales/ru/ui.json';
import enUI from '../locales/en/ui.json';

interface HintData {
  title: string;
  text: string;
}

export default function LifeScreen() {
  const player = usePlayerStore();
  const { addLog } = useEventStore();
  const { locale, toggleLocale } = useLocaleStore();
  const pushUiNotification = useNotificationStore((state) => state.pushUiNotification);
  const pushEventNotification = useNotificationStore((state) => state.pushEventNotification);

  const [hint, setHint] = useState<HintData | null>(null);

  const eventsData: any = locale === 'ru' ? ruEvents : enEvents;
  const ui: any = locale === 'ru' ? ruUI.life_screen : enUI.life_screen;
  const hints: any = (ui as any).hints || {};

  useEffect(() => {
    if (player.age === 0 && player.money === '0' && player.health === 100 && player.qi === '0' && !player.isDead) {
      player.reincarnate();
      addLog(ui.born_log, 'system');
      pushUiNotification('born', 'system');
    }
  }, []);

  useEffect(() => {
    if (player.isDead) {
      addLog(ui.death_log, 'system');
      pushUiNotification('death', 'danger');
    }
  }, [player.isDead]);

  const foundStageIndex = stagesData.findIndex((stage) => stage.id === player.cultivationStage);
  const currentStageIndex = 0 > foundStageIndex ? 0 : foundStageIndex;
  const nextStage = stagesData[currentStageIndex + 1];

  const qiProgress = nextStage ? getBigIntProgress(player.qi, nextStage.requiredQi) : 1;
  const healthProgress = player.health / 100;

  const openHint = (key: string) => {
    const hintData = hints[key];

    if (!hintData) {
      return;
    }

    setHint({
      title: hintData.title || key,
      text: hintData.text || '',
    });
  };

  const handleGrowOlder = () => {
    const now = Date.now();

    if (!player.hasCultivatorPass) {
      if (now - player.lastInterstitialTime > GameConstants.AD_INTERSTITIAL_COOLDOWN_MS) {
        player.setLastInterstitialTime(now);
        addLog(ui.interstitial_log, 'system');
        pushUiNotification('interstitial', 'system');
      }
    }

    player.growOlder();

    let secretEventChance = 0.1;

    if (player.activityFocus === 'secret') {
      secretEventChance = 0.8;
      player.addQi(player.spiritualRoot.toString());
      addLog(ui.meditation_log.replace('{amount}', player.spiritualRoot.toString()), 'secret');
      pushUiNotification('meditation', 'secret', {
        amount: player.spiritualRoot.toString(),
      });
    }

    const isSecretEvent = secretEventChance > Math.random();
    const eventPool = isSecretEvent ? eventsData.secret : eventsData.mundane;
    const randomEvent = eventPool[Math.floor(Math.random() * eventPool.length)];

    player.applyEffects(randomEvent.effects);

    const ageString = ui.age_log.replace('{age}', (player.age + 1).toString());
    addLog(`${ageString} ${randomEvent.text}`, isSecretEvent ? 'secret' : 'mundane');

    pushEventNotification(
      randomEvent.id,
      isSecretEvent ? 'secret' : 'mundane',
      isSecretEvent ? 'secret' : 'mundane'
    );
  };

  const handleReincarnate = () => {
    player.reincarnate();
    addLog(ui.reincarnate_log, 'system');
    pushUiNotification('reincarnate', 'system');
  };

  if (player.isDead) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
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

        <Modal visible={hint !== null} transparent animationType="fade" onRequestClose={() => setHint(null)}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setHint(null)}>
            <TouchableOpacity activeOpacity={1} onPress={() => undefined} style={styles.modalCard}>
              <Text style={styles.modalTitle}>{hint?.title}</Text>
              <Text style={styles.modalText}>{hint?.text}</Text>
              <Button
                title={hints.close || 'OK'}
                onPress={() => setHint(null)}
                variant="primary"
                small
                style={styles.modalButton}
              />
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{ui.title}</Text>
          <TouchableOpacity style={styles.langChip} onPress={toggleLocale}>
            <Text style={styles.langChipText}>{locale.toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        <Card variant="primary" style={styles.heroCard}>
          <Text style={styles.heroAgeLabel}>{ui.age}</Text>
          <Text style={styles.heroAgeValue}>{player.age}</Text>

          <ProgressBar progress={healthProgress} color={Theme.colors.success} height={10} style={styles.heroProgress} />
          <Text style={styles.heroProgressLabel}>
            {ui.health}: {player.health}/100
          </Text>

          <ProgressBar progress={qiProgress} color={Theme.colors.info} height={10} style={styles.heroProgress} />
          <Text style={styles.heroProgressLabel}>
            {ui.qi}: {formatLargeNumber(player.qi)}
          </Text>
        </Card>

        <Card style={styles.statsCard}>
          <StatRow
            icon="school"
            label={ui.intelligence}
            value={player.intelligence.toString()}
            color={Theme.colors.secondary}
            onLongPress={() => openHint('intelligence')}
          />
          <StatRow
            icon="heart"
            label={ui.health}
            value={player.health.toString()}
            color={Theme.colors.success}
            onLongPress={() => openHint('health')}
          />
          <StatRow
            icon="diamond"
            label={ui.appearance}
            value={player.appearance.toString()}
            color={Theme.colors.warning}
            onLongPress={() => openHint('appearance')}
          />
          <StatRow
            icon="cash"
            label={ui.money}
            value={`$${formatLargeNumber(player.money)}`}
            color={Theme.colors.gold}
            onLongPress={() => openHint('money')}
          />
          <StatRow
            icon="flame"
            label={ui.spiritual_root}
            value={player.spiritualRoot.toString()}
            color={Theme.colors.info}
            onLongPress={() => openHint('spiritual_root')}
          />
          <StatRow
            icon="sparkles"
            label={ui.karma}
            value={formatLargeNumber(player.karma)}
            color={Theme.colors.primarySoft}
            onLongPress={() => openHint('karma')}
          />
        </Card>

        <Card style={styles.focusCard}>
          <Text style={styles.focusTitle}>{ui.focus_title}</Text>

          <View style={styles.focusRow}>
            <TouchableOpacity
              style={[styles.focusChip, styles.focusChipLeft, player.activityFocus === 'mundane' && styles.focusChipActiveMundane]}
              onPress={() => player.setActivityFocus('mundane')}
              onLongPress={() => openHint('focus_mundane')}
            >
              <Text style={[styles.focusChipText, player.activityFocus === 'mundane' && styles.focusChipTextActive]}>
                {ui.focus_mundane}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.focusChip, player.activityFocus === 'secret' && styles.focusChipActiveSecret]}
              onPress={() => player.setActivityFocus('secret')}
              onLongPress={() => openHint('focus_secret')}
            >
              <Text style={[styles.focusChipText, player.activityFocus === 'secret' && styles.focusChipTextActive]}>
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

      <Modal visible={hint !== null} transparent animationType="fade" onRequestClose={() => setHint(null)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setHint(null)}>
          <TouchableOpacity activeOpacity={1} onPress={() => undefined} style={styles.modalCard}>
            <Text style={styles.modalTitle}>{hint?.title}</Text>
            <Text style={styles.modalText}>{hint?.text}</Text>
            <Button
              title={hints.close || 'OK'}
              onPress={() => setHint(null)}
              variant="primary"
              small
              style={styles.modalButton}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  heroCard: {
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  heroAgeLabel: {
    color: Theme.colors.textMuted,
    fontSize: Theme.fontSize.sm,
    marginBottom: 4,
  },
  heroAgeValue: {
    color: Theme.colors.text,
    fontSize: Theme.fontSize.hero,
    fontWeight: '900',
    marginBottom: Theme.spacing.md,
  },
  heroProgress: {
    marginBottom: 8,
  },
  heroProgressLabel: {
    color: Theme.colors.textMuted,
    fontSize: Theme.fontSize.xs,
    marginBottom: Theme.spacing.sm,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.primarySoft,
    padding: Theme.spacing.lg,
    alignItems: 'center',
    ...Theme.shadow,
  },
  modalTitle: {
    color: Theme.colors.text,
    fontSize: Theme.fontSize.lg,
    fontWeight: '900',
    marginBottom: Theme.spacing.sm,
    textAlign: 'center',
  },
  modalText: {
    color: Theme.colors.textMuted,
    fontSize: Theme.fontSize.sm,
    lineHeight: 20,
    marginBottom: Theme.spacing.md,
    textAlign: 'center',
  },
  modalButton: {
    minWidth: 160,
  },
});
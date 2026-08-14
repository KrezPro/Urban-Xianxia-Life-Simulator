import React, { useEffect, useRef, useState } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePlayerStore } from '../store/usePlayerStore';
import { useEventStore } from '../store/useEventStore';
import { useLocaleStore } from '../store/useLocaleStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useLifestyleStore } from '../store/useLifestyleStore';
import { Button, Card, ProgressBar, StatRow } from '../components/ui';
import { DraggableGrowButton } from '../components/game/DraggableGrowButton';
import { LifeAvatar, getAvatarAgeGroup } from '../components/game/LifeAvatar';
import { playUiPress } from '../audio/AudioManager';
import { Theme } from '../constants/Theme';
import { formatLargeNumber, getBigIntProgress, safeBigInt } from '../utils/helpers';
import { getSurvivalCost, getLifestyleAnnualCost, getOptionById } from '../utils/gameplayUtils';
import { getStageName } from '../utils/stageUtils';
import { useYearlyCycle } from '../hooks/useYearlyCycle';
import { resolveLocalizedKey } from '../utils/i18n';
import { shouldShowDeathAd } from '../utils/adsUtils';
import { AdService } from '../services/AdService';
import { LifestyleCategory } from '../types';
import LogScreen from './LogScreen';
import stagesData from '../data/stages.json';

interface HintData {
  title: string;
  text: string;
}

export default function LifeScreen() {
  const player = usePlayerStore();
  const { addLog } = useEventStore();
  const locale = useLocaleStore((state) => state.locale);
  const lifestyle = useLifestyleStore();
  const pushUiNotification = useNotificationStore((state) => state.pushUiNotification);
  const missedNotifications = useNotificationStore((state) => state.missedCount);
  const clearMissedNotifications = useNotificationStore((state) => state.clearMissedNotifications);
  const { handleGrowOlder } = useYearlyCycle();
  const [hint, setHint] = useState<HintData | null>(null);
  const [logVisible, setLogVisible] = useState(false);
  const deathNotificationSentRef = useRef(false);
  const { height: windowHeight } = useWindowDimensions();
  const scale = Math.min(1.35, Math.max(0.75, windowHeight / 800));
  const sw = (v: number) => Math.round(v * scale);
  const avatarSize = Math.min(96, Math.max(54, sw(76)));
  const ageFontSize = Math.min(40, Math.max(24, sw(32)));
  const tLife = (key: string, params?: Record<string, string | number>): string =>
    resolveLocalizedKey(locale, 'ui', `life_screen.${key}`, params);
  const tRebirth = (key: string, params?: Record<string, string | number>): string =>
    resolveLocalizedKey(locale, 'rebirth', key, params);
  const foundStageIndex = (stagesData as any[]).findIndex(
    (stage) => stage.id === player.cultivationStage
  );
  const currentStageIndex = 0 > foundStageIndex ? 0 : foundStageIndex;
  const nextStage = (stagesData as any[])[currentStageIndex + 1];
  const qiProgress = nextStage ? getBigIntProgress(player.qi, nextStage.requiredQi) : 1;
  const healthProgress = player.maxHealth > 0 ? player.health / player.maxHealth : 0;
  const missedBadgeText = missedNotifications > 99 ? '99+' : missedNotifications.toString();
  const avatarGroup = getAvatarAgeGroup(player.age);
  const avatarAria = tLife(`avatar.aria_${avatarGroup}`);
  const stageLabel = getStageName(player.cultivationStage, locale);
  const survivalCost = getSurvivalCost(player.age, player.cultivationStage);
  let lifestyleCost = 0n;
  (Object.keys(lifestyle.selected) as LifestyleCategory[]).forEach((category) => {
    const option = getOptionById(lifestyle.selected[category]);
    if (option) {
      lifestyleCost += getLifestyleAnnualCost(option);
    }
  });
  const totalExpensesBig = safeBigInt(survivalCost.toString()) + lifestyleCost;
  const expensesValue =
    totalExpensesBig > 0n ? `-$${formatLargeNumber(totalExpensesBig.toString())}` : '$0';
  const deathCauseText =
    tLife(`death_causes.${player.lastDeathCause || 'none'}`) || tLife('death_causes.none');
  const rebirthReport = player.lastRebirthReport;
  const hasRebirthPenalties =
    !!rebirthReport &&
    (rebirthReport.moneyPenaltyBps > 0 ||
      rebirthReport.healthStartBps < 10000 ||
      (rebirthReport.curses || []).length > 0);
  useEffect(() => {
    if (
      player.age === 0 &&
      player.money === '0' &&
      player.health === 100 &&
      player.qi === '0' &&
      !player.isDead
    ) {
      player.reincarnate();
      const bornLog = tLife('born_log');
      if (bornLog) {
        addLog(bornLog, 'system');
      }
      pushUiNotification('born', 'system');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (player.isDead) {
      if (!deathNotificationSentRef.current) {
        deathNotificationSentRef.current = true;
        const deathLog = tLife('death_log');
        if (deathLog) {
          addLog(deathLog, 'system');
        }
        pushUiNotification('death_reason', 'danger', {
          reason: deathCauseText,
        });
        // Реклама после смерти: 5-я смерть -> первая, 8-я -> вторая,
        // 9+ -> каждую смерть. Remove Ads (hasCultivatorPass) отключает показ.
        const freshState = usePlayerStore.getState();
        if (
          shouldShowDeathAd(
            freshState.totalDeaths,
            freshState.hasCultivatorPass,
            freshState.deathAdShownForDeath
          )
        ) {
          // Метка ставится ДО async-показа: защита от двойного показа
          // при ре-рендерах и перезапуске приложения (урок DataForAI 21).
          freshState.setDeathAdShownForDeath(freshState.totalDeaths);
          const deathAdLog = tLife('death_ad_log', { death: freshState.totalDeaths });
          if (deathAdLog) {
            addLog(deathAdLog, 'system');
          }
          AdService.showDeathInterstitial();
        }
      }
    } else {
      deathNotificationSentRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.isDead]);
  const openHint = (key: string) => {
    const title = tLife(`hints.${key}.title`);
    const text = tLife(`hints.${key}.text`);
    if (!title && !text) {
      return;
    }
    setHint({
      title: title || key,
      text,
    });
  };
  const openAgeHint = () => {
    const stage: any =
      (stagesData as any[]).find((item) => item.id === player.cultivationStage) ||
      (stagesData as any[])[0];
    if (!stage) {
      return;
    }
    if (stage.maxAge > 0) {
      const title = tLife('hints.age.title');
      const text = tLife('hints.age.text', {
        maxAge: stage.maxAge,
        softAge: stage.softAge,
      });
      if (!title && !text) {
        return;
      }
      setHint({ title, text });
      return;
    }
    const title = tLife('hints.age_immortal.title');
    const text = tLife('hints.age_immortal.text');
    if (!title && !text) {
      return;
    }
    setHint({ title, text });
  };
  const openExpensesHint = () => {
    const title = tLife('hints.expenses.title');
    const text = tLife('hints.expenses.text', {
      survival: `$${formatLargeNumber(survivalCost.toString())}`,
      lifestyle: `$${formatLargeNumber(lifestyleCost.toString())}`,
    });
    if (!title && !text) {
      return;
    }
    setHint({ title, text });
  };
  const openLog = () => {
    setLogVisible(true);
    clearMissedNotifications();
  };
  const handleOpenLog = () => {
    playUiPress?.();
    openLog();
  };
  const handleAgeHintPress = () => {
    playUiPress?.();
    openAgeHint();
  };
  const handleFocusMundane = () => {
    playUiPress?.();
    player.setActivityFocus('mundane');
  };
  const handleFocusSecret = () => {
    playUiPress?.();
    player.setActivityFocus('secret');
  };
  const handleFocusMundaneLong = () => {
    playUiPress?.();
    openHint('focus_mundane');
  };
  const handleFocusSecretLong = () => {
    playUiPress?.();
    openHint('focus_secret');
  };
  const handleReincarnate = () => {
    player.reincarnate();
    const reincarnateLog = tLife('reincarnate_log');
    if (reincarnateLog) {
      addLog(reincarnateLog, 'system');
    }
    pushUiNotification('reincarnate', 'system');
  };
  const closeRebirthReport = () => {
    player.clearRebirthReport();
  };
  const titleBlock = (
    <View style={styles.titleRow}>
      <Text style={[styles.title, { fontSize: sw(24) }]}>{tLife('title')}</Text>
      <View style={styles.versionChip}>
        <Text style={styles.versionChipText}>{tLife('title_version')}</Text>
      </View>
    </View>
  );
  const logButton = (
    <TouchableOpacity
      style={styles.logButton}
      onPress={handleOpenLog}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={tLife('btn_log')}
    >
      <Ionicons name="book-outline" size={20} color={Theme.colors.text} />
      {missedNotifications > 0 ? (
        <View style={styles.logBadge}>
          <Text style={styles.logBadgeText}>{missedBadgeText}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
  const renderRebirthReport = () => {
    if (!rebirthReport || !hasRebirthPenalties) {
      return null;
    }
    return (
      <Modal visible transparent animationType="fade" onRequestClose={closeRebirthReport}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={closeRebirthReport}>
          <TouchableOpacity activeOpacity={1} onPress={() => undefined} style={styles.modalCard}>
            <Text style={styles.modalTitle}>{tRebirth('title')}</Text>
            <Text style={styles.rebirthTierTitle}>
              {tRebirth(`tiers.${rebirthReport.fortuneTier}.title`)}
            </Text>
            <Text style={styles.modalText}>
              {tRebirth(`tiers.${rebirthReport.fortuneTier}.desc`)}
            </Text>
            <View style={styles.rebirthRow}>
              <Text style={styles.rebirthLine}>
                {tRebirth(`money.${rebirthReport.moneyPenaltyKey}`)}
              </Text>
            </View>
            <View style={styles.rebirthRow}>
              <Text style={styles.rebirthLine}>
                {tRebirth(`health.${rebirthReport.healthStartKey}`)}
              </Text>
            </View>
            {(rebirthReport.curses || []).map((curseId) => {
              const curseName = tRebirth(`curses.${curseId}.name`);
              const curseDesc = tRebirth(`curses.${curseId}.desc`);
              if (!curseName && !curseDesc) {
                return null;
              }
              return (
                <View key={curseId} style={styles.curseRow}>
                  <Text style={styles.curseName}>{curseName}</Text>
                  <Text style={styles.curseDesc}>{curseDesc}</Text>
                </View>
              );
            })}
            <Button
              title={tRebirth('accept')}
              onPress={closeRebirthReport}
              variant="danger"
              style={styles.modalButton}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  };
  const logModal = (
    <Modal visible={logVisible} animationType="slide" onRequestClose={() => setLogVisible(false)}>
      <LogScreen onClose={() => setLogVisible(false)} />
    </Modal>
  );
  const hintModal = (
    <Modal visible={hint !== null} transparent animationType="fade" onRequestClose={() => setHint(null)}>
      <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setHint(null)}>
        <TouchableOpacity activeOpacity={1} onPress={() => undefined} style={styles.modalCard}>
          <Text style={styles.modalTitle}>{hint?.title}</Text>
          <Text style={styles.modalText}>{hint?.text}</Text>
          <Button
            title={tLife('hints.close')}
            onPress={() => setHint(null)}
            variant="primary"
            small
            style={styles.modalButton}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
  if (player.isDead) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.content, { padding: sw(16) }]}>
          <View style={[styles.headerRow, { marginBottom: sw(12) }]}>
            {titleBlock}
            <View style={styles.headerActions}>{logButton}</View>
          </View>
          <Card variant="danger" style={styles.deadCard}>
            <Text style={styles.deadTitle}>{tLife('dead_title')}</Text>
            <Text style={styles.deadSubtitle}>{tLife('dead_subtitle')}</Text>
            <View style={styles.karmaRow}>
              <Text style={styles.karmaLabel}>{tLife('death_cause_label')}</Text>
              <Text style={styles.karmaValue}>{deathCauseText}</Text>
            </View>
            <View style={styles.karmaRow}>
              <Text style={styles.karmaLabel}>{tLife('karma_earned_last_life')}</Text>
              <Text style={styles.karmaValue}>
                +{formatLargeNumber(player.lastLifeKarmaEarned)}
              </Text>
            </View>
            <View style={styles.karmaRow}>
              <Text style={styles.karmaLabel}>{tLife('karma_accumulated')}</Text>
              <Text style={styles.karmaValue}>{formatLargeNumber(player.karma)}</Text>
            </View>
            <Button
              title={tLife('btn_reincarnate')}
              onPress={handleReincarnate}
              variant="danger"
              icon="refresh"
              style={styles.reincarnateButton}
            />
          </Card>
        </View>
        {logModal}
        {hintModal}
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.content, { padding: sw(16) }]}>
        <View style={[styles.headerRow, { marginBottom: sw(12) }]}>
          {titleBlock}
          <View style={styles.headerActions}>{logButton}</View>
        </View>
        <Card variant="primary" style={[styles.heroCard, { padding: sw(12), marginBottom: sw(10) }]}>
          <View style={[styles.heroTopRow, { marginBottom: sw(8) }]}>
            <LifeAvatar
              age={player.age}
              cultivationStage={player.cultivationStage}
              accessibilityLabel={avatarAria}
              stageLabel={stageLabel}
              size={avatarSize}
            />
            <View style={styles.heroAgeBlock}>
              <Text style={[styles.heroAgeLabel, { fontSize: sw(13), marginBottom: 2 }]}>
                {tLife('age')}
              </Text>
              <TouchableOpacity onPress={handleAgeHintPress} onLongPress={handleAgeHintPress} delayLongPress={300}>
                <Text style={[styles.heroAgeValue, { fontSize: ageFontSize }]}>{player.age}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <ProgressBar
            progress={healthProgress}
            color={Theme.colors.success}
            height={Math.max(6, sw(9))}
            style={{ marginBottom: sw(6) }}
          />
          <Text style={[styles.heroProgressLabel, { fontSize: sw(11), marginBottom: sw(6) }]}>
            {tLife('health')}: {formatLargeNumber(player.health)}/{formatLargeNumber(player.maxHealth)}
          </Text>
          <ProgressBar
            progress={qiProgress}
            color={Theme.colors.info}
            height={Math.max(6, sw(9))}
            style={{ marginBottom: sw(6) }}
          />
          <Text style={[styles.heroProgressLabel, { fontSize: sw(11), marginBottom: 0 }]}>
            {tLife('qi')}: {formatLargeNumber(player.qi)}
          </Text>
        </Card>
        <Card style={{ padding: sw(12), marginBottom: sw(10), flex: 1 }}>
          <View style={styles.statFlex}>
            <StatRow
              icon="school"
              label={tLife('intelligence')}
              value={player.intelligence.toString()}
              color={Theme.colors.secondary}
              scale={scale}
              onLongPress={() => openHint('intelligence')}
            />
          </View>
          <View style={styles.statFlex}>
            <StatRow
              icon="heart"
              label={tLife('health')}
              value={formatLargeNumber(player.maxHealth)}
              color={Theme.colors.success}
              scale={scale}
              onLongPress={() => openHint('health')}
            />
          </View>
          <View style={styles.statFlex}>
            <StatRow
              icon="diamond"
              label={tLife('appearance')}
              value={player.appearance.toString()}
              color={Theme.colors.warning}
              scale={scale}
              onLongPress={() => openHint('appearance')}
            />
          </View>
          <View style={styles.statFlex}>
            <StatRow
              icon="cash"
              label={tLife('money')}
              value={`$${formatLargeNumber(player.money)}`}
              color={Theme.colors.gold}
              scale={scale}
              onLongPress={() => openHint('money')}
            />
          </View>
          <View style={styles.statFlex}>
            <StatRow
              icon="wallet-outline"
              label={tLife('expenses_year')}
              value={expensesValue}
              color={Theme.colors.danger}
              scale={scale}
              onLongPress={openExpensesHint}
            />
          </View>
          <View style={styles.statFlex}>
            <StatRow
              icon="flame"
              label={tLife('spiritual_root')}
              value={player.spiritualRoot.toString()}
              color={Theme.colors.info}
              scale={scale}
              onLongPress={() => openHint('spiritual_root')}
            />
          </View>
          <View style={styles.statFlex}>
            <StatRow
              icon="sparkles"
              label={tLife('karma')}
              value={formatLargeNumber(player.karma)}
              color={Theme.colors.primarySoft}
              scale={scale}
              onLongPress={() => openHint('karma')}
            />
          </View>
        </Card>
        <Card style={{ padding: sw(12) }}>
          <Text style={[styles.focusTitle, { fontSize: sw(13), marginBottom: sw(6) }]}>
            {tLife('focus_title')}
          </Text>
          <View style={styles.focusRow}>
            <TouchableOpacity
              style={[
                styles.focusChip,
                styles.focusChipLeft,
                { paddingVertical: sw(11) },
                player.activityFocus === 'mundane' && styles.focusChipActiveMundane,
              ]}
              onPress={handleFocusMundane}
              onLongPress={handleFocusMundaneLong}
            >
              <Text
                style={[
                  styles.focusChipText,
                  { fontSize: sw(14) },
                  player.activityFocus === 'mundane' && styles.focusChipTextActive,
                ]}
              >
                {tLife('focus_mundane')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.focusChip,
                { paddingVertical: sw(11) },
                player.activityFocus === 'secret' && styles.focusChipActiveSecret,
              ]}
              onPress={handleFocusSecret}
              onLongPress={handleFocusSecretLong}
            >
              <Text
                style={[
                  styles.focusChipText,
                  { fontSize: sw(14) },
                  player.activityFocus === 'secret' && styles.focusChipTextActive,
                ]}
              >
                {tLife('focus_secret')}
              </Text>
            </TouchableOpacity>
          </View>
        </Card>
      </View>
      <DraggableGrowButton
        age={player.age}
        onPress={handleGrowOlder}
        accessibilityLabel={tLife('btn_grow')}
      />
      {logModal}
      {hintModal}
      {renderRebirthReport()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Theme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: Theme.colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logBadge: {
    position: 'absolute',
    top: -6,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Theme.colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: Theme.colors.background,
  },
  logBadgeText: {
    color: Theme.colors.text,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '900',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontWeight: '900',
    color: Theme.colors.gold,
    letterSpacing: 1,
  },
  versionChip: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Theme.colors.gold,
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
  },
  versionChipText: {
    color: Theme.colors.gold,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  heroCard: {
    alignItems: 'center',
  },
  heroTopRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAgeBlock: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  heroAgeLabel: {
    color: Theme.colors.textMuted,
  },
  heroAgeValue: {
    color: Theme.colors.text,
    fontWeight: '900',
  },
  heroProgressLabel: {
    color: Theme.colors.textMuted,
  },
  statFlex: {
    flex: 1,
    justifyContent: 'center',
  },
  focusTitle: {
    color: Theme.colors.textMuted,
    textAlign: 'center',
  },
  focusRow: {
    flexDirection: 'row',
  },
  focusChip: {
    flex: 1,
    borderRadius: Theme.radius.md,
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
  rebirthTierTitle: {
    color: Theme.colors.danger,
    fontSize: Theme.fontSize.md,
    fontWeight: '900',
    marginBottom: 6,
    textAlign: 'center',
  },
  rebirthRow: {
    width: '100%',
    marginBottom: 6,
  },
  rebirthLine: {
    color: Theme.colors.text,
    fontSize: Theme.fontSize.sm,
    fontWeight: '700',
  },
  curseRow: {
    width: '100%',
    backgroundColor: Theme.colors.surfaceLight,
    borderRadius: Theme.radius.sm,
    borderWidth: 1,
    borderColor: Theme.colors.borderSoft,
    padding: Theme.spacing.sm,
    marginBottom: 6,
  },
  curseName: {
    color: Theme.colors.danger,
    fontWeight: '900',
    marginBottom: 2,
  },
  curseDesc: {
    color: Theme.colors.textMuted,
    fontSize: Theme.fontSize.xs,
  },
});
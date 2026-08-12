import React, { useEffect, useMemo, useRef } from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePlayerStore } from '../store/usePlayerStore';
import { useEventStore } from '../store/useEventStore';
import { useLocaleStore } from '../store/useLocaleStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { Button, Card, ProgressBar } from '../components/ui';
import { Theme } from '../constants/Theme';
import { formatLargeNumber, getBigIntProgress } from '../utils/helpers';
import { GameConstants } from '../constants/GameConstants';
import {
  getContentMaxWidth,
  getHorizontalPadding,
  getNotificationAreaHeight,
  isTablet,
  scaleFont,
  scaleSize,
} from '../utils/layout';
import stagesData from '../data/stages.json';
import ruEvents from '../locales/ru/events.json';
import enEvents from '../locales/en/events.json';
import ruUI from '../locales/ru/ui.json';
import enUI from '../locales/en/ui.json';

export default function LifeScreen() {
  const player = usePlayerStore();
  const { addLog } = useEventStore();
  const { locale, toggleLocale } = useLocaleStore();
  const pushUiNotification = useNotificationStore((state) => state.pushUiNotification);
  const pushEventNotification = useNotificationStore((state) => state.pushEventNotification);

  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const deathNotifiedRef = useRef(false);
  const bornNotifiedRef = useRef(false);

  const eventsData: any = locale === 'ru' ? ruEvents : enEvents;
  const ui: any = locale === 'ru' ? ruUI.life_screen : enUI.life_screen;

  const styles = useMemo(() => createStyles(), [width, height, insets.top, insets.bottom]);

  const topPadding = insets.top + getNotificationAreaHeight() + scaleSize(8);
  const bottomPadding = insets.bottom + scaleSize(24);

  useEffect(() => {
    if (
      !bornNotifiedRef.current &&
      player.age === 0 &&
      player.money === '0' &&
      player.health === 100 &&
      player.qi === '0' &&
      !player.isDead
    ) {
      bornNotifiedRef.current = true;
      player.reincarnate();
      addLog(ui.born_log, 'system');
      pushUiNotification('born', 'system');
    }
  }, []);

  useEffect(() => {
    if (player.isDead) {
      if (!deathNotifiedRef.current) {
        deathNotifiedRef.current = true;
        addLog(ui.death_log, 'system');
        pushUiNotification('death', 'danger');
      }
    } else {
      deathNotifiedRef.current = false;
    }
  }, [player.isDead]);

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
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            styles.deadScrollContent,
            {
              paddingTop: topPadding,
              paddingBottom: bottomPadding,
            },
          ]}
        >
          <View style={styles.contentColumn}>
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
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: topPadding,
            paddingBottom: bottomPadding,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentColumn}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{ui.title}</Text>

            <TouchableOpacity style={styles.langChip} onPress={toggleLocale}>
              <Text style={styles.langChipText}>{locale.toUpperCase()}</Text>
            </TouchableOpacity>
          </View>

          <Card variant="primary" style={styles.heroCard}>
            <Text style={styles.heroAgeLabel}>{ui.age}</Text>
            <Text style={styles.heroAgeValue}>{player.age}</Text>

            <ProgressBar
              progress={healthProgress}
              color={Theme.colors.success}
              height={scaleSize(10)}
              style={styles.progressBar}
            />
            <Text style={styles.heroProgressLabel}>
              {ui.health}: {player.health}/100
            </Text>

            <ProgressBar
              progress={qiProgress}
              color={Theme.colors.info}
              height={scaleSize(10)}
              style={styles.progressBar}
            />
            <Text style={styles.heroProgressLabel}>
              {ui.qi}: {formatLargeNumber(player.qi)}
            </Text>
          </Card>

          <Card style={styles.statsCard}>
            <View style={styles.statsGrid}>
              <View style={styles.statCell}>
                <View style={[styles.statIconBadge, { borderColor: Theme.colors.secondary }]}> 
                  <Ionicons name="school" size={scaleSize(16)} color={Theme.colors.secondary} />
                </View>
                <View style={styles.statTextWrap}>
                  <Text style={styles.statLabel}>{ui.intelligence}</Text>
                  <Text style={styles.statValue}>{player.intelligence}</Text>
                </View>
              </View>

              <View style={styles.statCell}>
                <View style={[styles.statIconBadge, { borderColor: Theme.colors.success }]}> 
                  <Ionicons name="heart" size={scaleSize(16)} color={Theme.colors.success} />
                </View>
                <View style={styles.statTextWrap}>
                  <Text style={styles.statLabel}>{ui.health}</Text>
                  <Text style={styles.statValue}>{player.health}</Text>
                </View>
              </View>

              <View style={styles.statCell}>
                <View style={[styles.statIconBadge, { borderColor: Theme.colors.warning }]}> 
                  <Ionicons name="diamond" size={scaleSize(16)} color={Theme.colors.warning} />
                </View>
                <View style={styles.statTextWrap}>
                  <Text style={styles.statLabel}>{ui.appearance}</Text>
                  <Text style={styles.statValue}>{player.appearance}</Text>
                </View>
              </View>

              <View style={styles.statCell}>
                <View style={[styles.statIconBadge, { borderColor: Theme.colors.gold }]}> 
                  <Ionicons name="cash" size={scaleSize(16)} color={Theme.colors.gold} />
                </View>
                <View style={styles.statTextWrap}>
                  <Text style={styles.statLabel}>{ui.money}</Text>
                  <Text style={styles.statValue}>${formatLargeNumber(player.money)}</Text>
                </View>
              </View>

              <View style={styles.statCell}>
                <View style={[styles.statIconBadge, { borderColor: Theme.colors.info }]}> 
                  <Ionicons name="flame" size={scaleSize(16)} color={Theme.colors.info} />
                </View>
                <View style={styles.statTextWrap}>
                  <Text style={styles.statLabel}>{ui.spiritual_root}</Text>
                  <Text style={styles.statValue}>{player.spiritualRoot}</Text>
                </View>
              </View>

              <View style={styles.statCell}>
                <View style={[styles.statIconBadge, { borderColor: Theme.colors.primarySoft }]}> 
                  <Ionicons name="sparkles" size={scaleSize(16)} color={Theme.colors.primarySoft} />
                </View>
                <View style={styles.statTextWrap}>
                  <Text style={styles.statLabel}>{ui.karma}</Text>
                  <Text style={styles.statValue}>{formatLargeNumber(player.karma)}</Text>
                </View>
              </View>
            </View>
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
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = () => {
  const horizontalPadding = getHorizontalPadding();
  const contentMaxWidth = getContentMaxWidth();
  const tablet = isTablet();

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Theme.colors.background,
    },
    scrollContent: {
      paddingHorizontal: horizontalPadding,
      alignItems: 'center',
      flexGrow: 1,
    },
    deadScrollContent: {
      justifyContent: 'center',
    },
    contentColumn: {
      width: '100%',
      maxWidth: contentMaxWidth,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: scaleSize(10),
    },
    title: {
      fontSize: scaleFont(24),
      fontWeight: '900',
      color: Theme.colors.text,
      letterSpacing: 1,
    },
    langChip: {
      paddingHorizontal: scaleSize(12),
      paddingVertical: scaleSize(6),
      borderRadius: 999,
      backgroundColor: Theme.colors.surfaceLight,
      borderWidth: 1,
      borderColor: Theme.colors.secondary,
    },
    langChipText: {
      color: Theme.colors.text,
      fontWeight: '800',
      fontSize: scaleFont(12),
    },
    heroCard: {
      alignItems: 'center',
      marginBottom: scaleSize(10),
      padding: scaleSize(14),
    },
    heroAgeLabel: {
      color: Theme.colors.textMuted,
      fontSize: scaleFont(12),
      marginBottom: 2,
    },
    heroAgeValue: {
      color: Theme.colors.text,
      fontSize: scaleFont(tablet ? 44 : 36),
      fontWeight: '900',
      marginBottom: scaleSize(8),
    },
    progressBar: {
      marginBottom: scaleSize(4),
    },
    heroProgressLabel: {
      color: Theme.colors.textMuted,
      fontSize: scaleFont(11),
      marginBottom: scaleSize(6),
      textAlign: 'center',
    },
    statsCard: {
      marginBottom: scaleSize(10),
      padding: scaleSize(10),
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -scaleSize(4),
    },
    statCell: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: scaleSize(6),
      paddingHorizontal: scaleSize(8),
      flexBasis: tablet ? '33.333%' : '50%',
    },
    statIconBadge: {
      width: scaleSize(tablet ? 32 : 28),
      height: scaleSize(tablet ? 32 : 28),
      borderRadius: scaleSize(9),
      backgroundColor: Theme.colors.surfaceLight,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: scaleSize(6),
    },
    statTextWrap: {
      flex: 1,
    },
    statLabel: {
      color: Theme.colors.textMuted,
      fontSize: scaleFont(10),
      marginBottom: 1,
    },
    statValue: {
      color: Theme.colors.text,
      fontWeight: '800',
      fontSize: scaleFont(12),
    },
    focusCard: {
      marginBottom: scaleSize(10),
      padding: scaleSize(12),
    },
    focusTitle: {
      color: Theme.colors.textMuted,
      textAlign: 'center',
      marginBottom: scaleSize(8),
      fontSize: scaleFont(12),
    },
    focusRow: {
      flexDirection: 'row',
    },
    focusChip: {
      flex: 1,
      borderRadius: Theme.radius.md,
      paddingVertical: scaleSize(10),
      alignItems: 'center',
      backgroundColor: Theme.colors.surfaceLight,
      borderWidth: 1,
      borderColor: Theme.colors.borderSoft,
    },
    focusChipLeft: {
      marginRight: scaleSize(8),
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
      fontSize: scaleFont(12),
    },
    focusChipTextActive: {
      color: Theme.colors.text,
    },
    mainActionButton: {
      marginTop: scaleSize(4),
    },
    deadCard: {
      alignItems: 'center',
      padding: scaleSize(18),
    },
    deadTitle: {
      fontSize: scaleFont(28),
      fontWeight: '900',
      color: Theme.colors.danger,
      marginBottom: scaleSize(6),
      textAlign: 'center',
    },
    deadSubtitle: {
      color: Theme.colors.textMuted,
      marginBottom: scaleSize(12),
      textAlign: 'center',
      fontSize: scaleFont(12),
    },
    karmaRow: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: scaleSize(6),
    },
    karmaLabel: {
      color: Theme.colors.textMuted,
      fontSize: scaleFont(12),
    },
    karmaValue: {
      color: Theme.colors.gold,
      fontWeight: '900',
      fontSize: scaleFont(12),
    },
    reincarnateButton: {
      marginTop: scaleSize(10),
      width: '100%',
    },
  });
};
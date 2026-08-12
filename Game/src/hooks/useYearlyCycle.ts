import { useCallback } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useEventStore } from '../store/useEventStore';
import { useLocaleStore } from '../store/useLocaleStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useTechniquesStore } from '../store/useTechniquesStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { useLifestyleStore } from '../store/useLifestyleStore';
import { GameConstants } from '../constants/GameConstants';
import { GeneratedEvent } from '../types';
import {
  combineModifiers,
  getTechniqueModifiers,
  getKarmaTotalEffects,
  processLifestyleYear,
  calculateOldAgeDeathBps,
  calculateAgeStageDeathBps,
  getSurvivalCost,
  calculateUnpaidSurvivalDamage,
  calculateMeditationQi,
} from '../utils/gameplayUtils';
import { getCurseModifiers } from '../utils/rebirthUtils';
import { generateYearEvent } from '../utils/eventGenerator';
import { getRandomInt, safeBigInt } from '../utils/helpers';
import ruUI from '../locales/ru/ui.json';
import enUI from '../locales/en/ui.json';
import ruNotifications from '../locales/ru/notifications.json';
import enNotifications from '../locales/en/notifications.json';

const buildFallbackEvent = (pool: 'mundane' | 'secret'): GeneratedEvent => ({
  id: 'fallback_year',
  pool,
  category: 'generic',
  rarity: 'common',
  tone: 'neutral',
  titleKey: 'titles.neutral_common',
  textKey: 'templates.tmpl_simple',
  params: { outcome: 'outcomes_generic.ok' },
  effects: {},
  displayEffects: [],
  logType: pool,
});

export const useYearlyCycle = () => {
  const { addLog, addGeneratedLog } = useEventStore();
  const locale = useLocaleStore((state) => state.locale);
  const pushUiNotification = useNotificationStore((state) => state.pushUiNotification);
  const pushGeneratedEventNotification = useNotificationStore(
    (state) => state.pushGeneratedEventNotification
  );
  const techniques = useTechniquesStore();
  const inventory = useInventoryStore();
  const lifestyle = useLifestyleStore();
  const ui: any = locale === 'ru' ? ruUI.life_screen : enUI.life_screen;
  const notifications: any = locale === 'ru' ? ruNotifications : enNotifications;

  const handleGrowOlder = useCallback(() => {
    let current = usePlayerStore.getState();
    if (current.isDead) {
      return;
    }

    current.growOlder();
    current = usePlayerStore.getState();

    if (
      current.age === GameConstants.AD_POLICY.FIRST_AGE_AFTER_REBIRTH &&
      !current.hasCultivatorPass &&
      !current.interstitialShownThisLife
    ) {
      current.setInterstitialShownThisLife(true);
      addLog(ui.interstitial_log, 'system');
      pushUiNotification('interstitial', 'system');
    }

    const ageStageDeathBps = calculateAgeStageDeathBps(
      current.age,
      current.cultivationStage,
      current.health,
      current.maxHealth,
      current.bodyTempering
    );
    if (ageStageDeathBps > 0 && getRandomInt(0, 9999) < ageStageDeathBps) {
      addLog(notifications.age_mortality, 'system');
      pushUiNotification('age_mortality', 'danger');
      current.setDeathCause('health');
      current.applyEffects({ health: -current.health });
      return;
    }

    const oldAgeDeathBps = calculateOldAgeDeathBps(current.age, current.cultivationStage);
    if (oldAgeDeathBps > 0 && getRandomInt(0, 9999) < oldAgeDeathBps) {
      addLog(notifications.old_age_death, 'system');
      pushUiNotification('old_age_death', 'danger');
      current.setDeathCause('old_age');
      current.applyEffects({ health: -current.health });
      return;
    }

    const survivalCost = getSurvivalCost(current.age, current.cultivationStage);
    if (survivalCost > 0n) {
      const money = safeBigInt(current.money);
      if (money >= survivalCost) {
        current.applyEffects({ money: (-survivalCost).toString() });
        current = usePlayerStore.getState();
      } else {
        const unpaid = survivalCost - money;
        if (money > 0n) {
          current.applyEffects({ money: (-money).toString() });
          current = usePlayerStore.getState();
        }
        const unpaidBps = Number((unpaid * 10000n) / survivalCost);
        const damage = calculateUnpaidSurvivalDamage(
          unpaidBps,
          current.age,
          current.maxHealth,
          current.bodyTempering
        );
        current.applyEffects({ health: -damage });
        current = usePlayerStore.getState();
        addLog(notifications.survival_unpaid, 'system');
        if (unpaidBps >= 5000) {
          pushUiNotification('survival_unpaid', 'danger');
        }
        if (current.isDead) {
          current.setDeathCause('health');
          return;
        }
      }
    }

    const curseModifiers = getCurseModifiers(current.activeCurses);
    const baseModifiers = combineModifiers(
      getTechniqueModifiers(techniques.levels),
      getKarmaTotalEffects(inventory.items),
      curseModifiers
    );

    const report = processLifestyleYear(
      {
        money: current.money,
        health: current.health,
        maxHealth: current.maxHealth,
        intelligence: current.intelligence,
        appearance: current.appearance,
        spiritualRoot: current.spiritualRoot,
        cultivationStage: current.cultivationStage,
        age: current.age,
        bodyTempering: current.bodyTempering,
      },
      lifestyle.selected,
      baseModifiers
    );

    if (report.disabled.length > 0) {
      report.disabled.forEach((category) => lifestyle.disableOption(category));
      addLog(notifications.lifestyle_disabled_no_money, 'system');
      pushUiNotification('lifestyle_disabled_no_money', 'danger');
    }

    if (report.maxHealthDelta !== 0 || report.healthDelta !== 0) {
      current.applyEffects({
        maxHealth: report.maxHealthDelta,
        health: report.healthDelta,
      });
      current = usePlayerStore.getState();
      if (current.isDead) {
        if (report.portalResult === 'fail') {
          current.setDeathCause('portal');
        } else {
          current.setDeathCause('health');
        }
        return;
      }
    }

    if (report.appearanceDelta !== 0) {
      current.applyEffects({ appearance: report.appearanceDelta });
      current = usePlayerStore.getState();
    }

    if (report.moneyDelta !== '0') {
      current.applyEffects({ money: report.moneyDelta });
      current = usePlayerStore.getState();
    }

    if (report.qiDelta !== '0') {
      current.addQi(report.qiDelta);
      current = usePlayerStore.getState();
    }

    if (report.portalResult === 'success') {
      pushUiNotification('portal_success', 'reward', {
        money: report.portalMoney,
        qi: report.portalQi,
      });
    }
    if (report.portalResult === 'fail') {
      pushUiNotification('portal_fail', 'danger', {
        damage: report.portalDamage.toString(),
      });
    }

    if (current.isDead) {
      return;
    }

    if (current.activityFocus === 'secret') {
      const qiGain = calculateMeditationQi(
        {
          spiritualRoot: current.spiritualRoot,
          cultivationStage: current.cultivationStage,
        },
        baseModifiers
      );
      current.addQi(qiGain);
      current = usePlayerStore.getState();
      addLog(ui.meditation_log.replace('{amount}', qiGain.toString()), 'secret');
    }

    if (current.isDead) {
      return;
    }

    let generatedEvent: GeneratedEvent;
    try {
      generatedEvent = generateYearEvent({
        age: current.age,
        focus: current.activityFocus,
        cultivationStage: current.cultivationStage,
        lifestyle: lifestyle.selected,
        player: {
          money: current.money,
          qi: current.qi,
          karma: current.karma,
          health: current.health,
          maxHealth: current.maxHealth,
          intelligence: current.intelligence,
          appearance: current.appearance,
          spiritualRoot: current.spiritualRoot,
          bodyTempering: current.bodyTempering,
        },
        modifiers: baseModifiers,
      });
    } catch {
      generatedEvent = buildFallbackEvent(current.activityFocus === 'secret' ? 'secret' : 'mundane');
    }

    addGeneratedLog(generatedEvent);
    pushGeneratedEventNotification(generatedEvent);
    current.applyEffects(generatedEvent.effects);
    const afterEvent = usePlayerStore.getState();
    if (afterEvent.isDead) {
      afterEvent.setDeathCause('event');
    }
  }, [techniques.levels, inventory.items, lifestyle.selected, locale]);

  return { handleGrowOlder };
};
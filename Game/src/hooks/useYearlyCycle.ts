import { useCallback } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useEventStore } from '../store/useEventStore';
import { useLocaleStore } from '../store/useLocaleStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useLifestyleStore } from '../store/useLifestyleStore';
import { GameConstants } from '../constants/GameConstants';
import { safeBigInt, getRandomInt, increaseBigIntByBps } from '../utils/helpers';
import { calculateOldAgeDeathBps, processLifestyleYear, getSurvivalCost } from '../utils/yearlyUtils';
import { generateYearEvent } from '../utils/eventGenerator';
import ruUI from '../locales/ru/ui.json';
import enUI from '../locales/en/ui.json';
import ruNotifications from '../locales/ru/notifications.json';
import enNotifications from '../locales/en/notifications.json';

interface YearHighlight {
  priority: number;
  options: any;
}

export const useYearlyCycle = () => {
  const { addLog, addGeneratedLog } = useEventStore();
  const locale = useLocaleStore((state) => state.locale);
  const pushRichNotification = useNotificationStore((state) => state.pushRichNotification);
  const lifestyle = useLifestyleStore();

  const ui: any = locale === 'ru' ? ruUI.life_screen : enUI.life_screen;
  const notifications: any = locale === 'ru' ? ruNotifications : enNotifications;

  const handleGrowOlder = useCallback(() => {
    let current = usePlayerStore.getState();

    if (current.isDead) {
      return;
    }

    const highlights: YearHighlight[] = [];

    const now = Date.now();

    if (!current.hasCultivatorPass) {
      if (now - current.lastInterstitialTime > GameConstants.AD_INTERSTITIAL_COOLDOWN_MS) {
        current.setLastInterstitialTime(now);
        addLog(ui.interstitial_log, 'system');
      }
    }

    current.growOlder();
    current = usePlayerStore.getState();

    const oldAgeDeathBps = calculateOldAgeDeathBps(current.age, current.cultivationStage);

    if (oldAgeDeathBps > 0 && getRandomInt(0, 9999) < oldAgeDeathBps) {
      addLog(notifications.old_age_death, 'system');
      current.applyEffects({ health: -current.health });
      return;
    }

    const survivalCost = getSurvivalCost(current.age);

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
        const damageBps = Math.floor((GameConstants.SURVIVAL_UNPAID_DAMAGE_BPS * unpaidBps) / 10000);
        let damage = Math.max(1, Math.floor((current.maxHealth * damageBps) / 10000));

        if (current.age < 12) {
          damage += GameConstants.SURVIVAL_CHILD_EXTRA_DAMAGE;
        }

        current.applyEffects({ health: -damage });
        current = usePlayerStore.getState();

        addLog(notifications.survival_unpaid, 'system');

        if (unpaidBps >= 5000) {
          highlights.push({
            priority: GameConstants.NOTIFICATION_PRIORITY.survival,
            options: {
              kind: 'ui',
              messageKey: 'survival_unpaid',
              type: 'danger',
              priority: GameConstants.NOTIFICATION_PRIORITY.survival,
              group: 'year',
              dictionary: 'notifications',
              durationMs: GameConstants.NOTIFICATION_DURATION_MS,
            },
          });
        }

        if (current.isDead) {
          return;
        }
      }
    }

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
      },
      lifestyle.selected
    );

    if (report.disabled.length > 0) {
      report.disabled.forEach((category) => lifestyle.disableOption(category));
      addLog(notifications.lifestyle_disabled_no_money, 'system');
    }

    if (report.portalResult === 'success') {
      highlights.push({
        priority: GameConstants.NOTIFICATION_PRIORITY.portal,
        options: {
          kind: 'ui',
          messageKey: 'portal_success',
          type: 'reward',
          priority: GameConstants.NOTIFICATION_PRIORITY.portal,
          group: 'year',
          params: {
            money: report.portalMoney,
            qi: report.portalQi,
          },
          dictionary: 'notifications',
          durationMs: GameConstants.NOTIFICATION_DURATION_MS,
        },
      });
    }

    if (report.portalResult === 'fail') {
      highlights.push({
        priority: GameConstants.NOTIFICATION_PRIORITY.portal,
        options: {
          kind: 'ui',
          messageKey: 'portal_fail',
          type: 'danger',
          priority: GameConstants.NOTIFICATION_PRIORITY.portal,
          group: 'year',
          params: {
            damage: report.portalDamage.toString(),
          },
          dictionary: 'notifications',
          durationMs: GameConstants.NOTIFICATION_DURATION_MS,
        },
      });
    }

    if (report.maxHealthDelta !== 0 || report.healthDelta !== 0) {
      current.applyEffects({
        maxHealth: report.maxHealthDelta,
        health: report.healthDelta,
      });
      current = usePlayerStore.getState();

      if (current.isDead) {
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

    if (current.isDead) {
      return;
    }

    if (current.activityFocus === 'secret') {
      const baseQi = current.spiritualRoot * GameConstants.MEDITATION_QI_MULTIPLIER;
      const qiGain = Number(increaseBigIntByBps(baseQi.toString(), 0));

      current.addQi(qiGain.toString());
      current = usePlayerStore.getState();

      addLog(ui.meditation_log.replace('{amount}', qiGain.toString()), 'secret');
    }

    if (current.isDead) {
      return;
    }

    const generatedEvent = generateYearEvent({
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
      },
    });

    addGeneratedLog(generatedEvent);

    current.applyEffects(generatedEvent.effects);
    current = usePlayerStore.getState();

    if (!current.isDead) {
      const params: Record<string, string> = {};

      Object.entries(generatedEvent.params).forEach(([key, value]) => {
        params[key] = String(value);
      });

      highlights.push({
        priority: GameConstants.NOTIFICATION_PRIORITY.generatedEvent,
        options: {
          kind: 'generated',
          messageKey: 'generated_event',
          type: generatedEvent.logType === 'secret' ? 'secret' : 'mundane',
          priority: GameConstants.NOTIFICATION_PRIORITY.generatedEvent,
          group: 'year',
          titleKey: generatedEvent.titleKey,
          textKey: generatedEvent.textKey,
          params,
          effects: generatedEvent.displayEffects,
          rarity: generatedEvent.rarity,
          tone: generatedEvent.tone,
          dictionary: 'eventGenerator',
          durationMs: GameConstants.EVENT_NOTIFICATION_DURATION_MS,
        },
      });
    }

    if (!current.isDead && highlights.length > 0) {
      const best = highlights.sort((a, b) => b.priority - a.priority)[0];
      pushRichNotification(best.options);
    }
  }, [lifestyle.selected, locale]);

  return { handleGrowOlder };
};
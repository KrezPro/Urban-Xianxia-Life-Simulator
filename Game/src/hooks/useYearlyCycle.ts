import { useCallback } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useEventStore } from '../store/useEventStore';
import { useLocaleStore } from '../store/useLocaleStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useTechniquesStore } from '../store/useTechniquesStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { useLifestyleStore } from '../store/useLifestyleStore';
import { GameConstants } from '../constants/GameConstants';
import {
  combineModifiers,
  getTechniqueModifiers,
  getKarmaTotalEffects,
  processLifestyleYear,
} from '../utils/gameplayUtils';
import ruEvents from '../locales/ru/events.json';
import enEvents from '../locales/en/events.json';
import ruUI from '../locales/ru/ui.json';
import enUI from '../locales/en/ui.json';

export const useYearlyCycle = () => {
  const { addLog } = useEventStore();
  const locale = useLocaleStore((state) => state.locale);
  const pushUiNotification = useNotificationStore((state) => state.pushUiNotification);
  const pushEventNotification = useNotificationStore((state) => state.pushEventNotification);
  const techniques = useTechniquesStore();
  const inventory = useInventoryStore();
  const lifestyle = useLifestyleStore();

  const eventsData: any = locale === 'ru' ? ruEvents : enEvents;
  const ui: any = locale === 'ru' ? ruUI.life_screen : enUI.life_screen;

  const handleGrowOlder = useCallback(() => {
    let current = usePlayerStore.getState();

    if (current.isDead) {
      return;
    }

    const now = Date.now();

    if (!current.hasCultivatorPass) {
      if (now - current.lastInterstitialTime > GameConstants.AD_INTERSTITIAL_COOLDOWN_MS) {
        current.setLastInterstitialTime(now);
        addLog(ui.interstitial_log, 'system');
        pushUiNotification('interstitial', 'system');
      }
    }

    current.growOlder();
    current = usePlayerStore.getState();

    const baseModifiers = combineModifiers(
      getTechniqueModifiers(techniques.levels),
      getKarmaTotalEffects(inventory.items)
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
      },
      lifestyle.selected,
      baseModifiers
    );

    if (report.disabled.length > 0) {
      report.disabled.forEach((category) => lifestyle.disableOption(category));
      pushUiNotification('lifestyle_disabled_no_money', 'danger');
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

    if (report.maxHealthDelta !== 0) {
      current.applyEffects({ maxHealth: report.maxHealthDelta });
      current = usePlayerStore.getState();
    }

    if (report.healthDelta !== 0) {
      current.applyEffects({ health: report.healthDelta });
      current = usePlayerStore.getState();
    }

    if (current.isDead) {
      return;
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

    let secretEventChance = 0.1;

    if (current.activityFocus === 'secret') {
      secretEventChance = 0.8;

      const qiGain = Math.max(
        1,
        Math.floor(current.spiritualRoot * (1 + baseModifiers.qiGainBps / 10000))
      );

      current.addQi(qiGain.toString());
      current = usePlayerStore.getState();

      addLog(ui.meditation_log.replace('{amount}', qiGain.toString()), 'secret');
      pushUiNotification('meditation', 'secret', {
        amount: qiGain.toString(),
      });
    }

    if (current.isDead) {
      return;
    }

    const isSecretEvent = secretEventChance > Math.random();
    const eventPool = isSecretEvent ? eventsData.secret : eventsData.mundane;
    const randomEvent = eventPool[Math.floor(Math.random() * eventPool.length)];

    const ageString = ui.age_log.replace('{age}', current.age.toString());
    current.applyEffects(randomEvent.effects);

    addLog(`${ageString} ${randomEvent.text}`, isSecretEvent ? 'secret' : 'mundane');
    pushEventNotification(
      randomEvent.id,
      isSecretEvent ? 'secret' : 'mundane',
      isSecretEvent ? 'secret' : 'mundane'
    );
  }, [techniques.levels, inventory.items, lifestyle.selected, locale]);

  return { handleGrowOlder };
};
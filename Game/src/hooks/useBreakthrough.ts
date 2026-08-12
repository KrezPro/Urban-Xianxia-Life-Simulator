import { usePlayerStore } from '../store/usePlayerStore';
import { useEventStore } from '../store/useEventStore';
import { useLocaleStore } from '../store/useLocaleStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useTechniquesStore } from '../store/useTechniquesStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { GameConstants } from '../constants/GameConstants';
import {
  combineModifiers,
  getTechniqueModifiers,
  getKarmaTotalEffects,
  getStageIndex,
} from '../utils/gameplayUtils';
import { clampInt, getRandomInt, reduceBigIntByBps } from '../utils/helpers';
import stagesData from '../data/stages.json';
import ruUI from '../locales/ru/ui.json';
import enUI from '../locales/en/ui.json';

export const useBreakthrough = () => {
  const player = usePlayerStore();
  const { addLog } = useEventStore();
  const pushUiNotification = useNotificationStore((state) => state.pushUiNotification);
  const locale = useLocaleStore((state) => state.locale);
  const techniques = useTechniquesStore();
  const inventory = useInventoryStore();

  const uiData: any = locale === 'ru' ? ruUI.dao_screen : enUI.dao_screen;

  const currentStageIndex = getStageIndex(player.cultivationStage);
  const nextStage = (stagesData as any[])[currentStageIndex + 1];

  const getChanceBps = (hasAdBuff: boolean = false): number => {
    if (!nextStage) {
      return 0;
    }

    const modifiers = combineModifiers(
      getTechniqueModifiers(techniques.levels),
      getKarmaTotalEffects(inventory.items)
    );

    let chanceBps =
      Math.floor(nextStage.baseSuccessRate * 10000) +
      player.spiritualRoot * 50 +
      player.intelligence * 20 +
      modifiers.breakthroughChanceBps;

    if (hasAdBuff) {
      chanceBps += 1500;
    }

    return clampInt(chanceBps, 0, GameConstants.BREAKTHROUGH_MAX_CHANCE_BPS);
  };

  const calculateChance = (hasAdBuff: boolean = false): number => {
    return getChanceBps(hasAdBuff) / 10000;
  };

  const attemptBreakthrough = (hasAdBuff: boolean = false, clearBuff: () => void) => {
    if (!nextStage || player.isDead) {
      return;
    }

    const reqQi = BigInt(nextStage.requiredQi);
    const currentQi = BigInt(player.qi);

    if (reqQi > currentQi) {
      addLog(uiData.log_no_qi, 'system');
      pushUiNotification('breakthrough_no_qi', 'system');
      return;
    }

    player.deductQi(nextStage.requiredQi);

    const chanceBps = getChanceBps(hasAdBuff);
    const roll = getRandomInt(0, 9999);
    const isSuccess = roll < chanceBps;

    if (isSuccess) {
      player.setCultivationStage(nextStage.id);
      addLog(uiData.log_success.replace('{name}', nextStage.name), 'secret');
      pushUiNotification('breakthrough_success', 'reward', {
        name: nextStage.name,
      });
    } else {
      if (hasAdBuff) {
        addLog(uiData.log_ad_saved, 'secret');
        pushUiNotification('breakthrough_saved', 'reward');
      } else {
        const stageIndex = Math.max(0, currentStageIndex);
        const baseDamage = 30 + stageIndex * 15;
        const maxHealthDamage = Math.floor(player.maxHealth * 0.2);
        const rawDamage = Math.max(baseDamage, maxHealthDamage);

        const modifiers = combineModifiers(
          getTechniqueModifiers(techniques.levels),
          getKarmaTotalEffects(inventory.items)
        );

        const damageReductionBps = clampInt(
          modifiers.damageReductionBps,
          0,
          GameConstants.DAMAGE_REDUCTION_CAP_BPS
        );

        const damage = Math.max(1, Number(reduceBigIntByBps(rawDamage.toString(), damageReductionBps)));

        player.applyEffects({ health: -damage });

        if (player.health > damage) {
          addLog(uiData.log_fail_damage.replace('{damage}', damage.toString()), 'secret');
          pushUiNotification('breakthrough_fail_damage', 'danger', {
            damage: damage.toString(),
          });
        } else {
          addLog(uiData.log_fail_death, 'system');
          pushUiNotification('breakthrough_fail_death', 'danger');
        }
      }
    }

    if (hasAdBuff) {
      clearBuff();
    }
  };

  return { attemptBreakthrough, nextStage, calculateChance };
};
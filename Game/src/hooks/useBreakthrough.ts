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
  getBodyBreakthroughReductionBps,
} from '../utils/gameplayUtils';
import { getCurseModifiers } from '../utils/rebirthUtils';
import { getStageName } from '../utils/stageUtils';
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
  const nextStageName = nextStage ? getStageName(nextStage.id, locale) : '';

  const getChanceBps = (hasAdBuff: boolean = false): number => {
    if (!nextStage) {
      return 0;
    }

    const modifiers = combineModifiers(
      getTechniqueModifiers(techniques.levels || {}),
      getKarmaTotalEffects(inventory.items || {}),
      getCurseModifiers(player.activeCurses || [])
    );

    let chanceBps =
      Math.floor(nextStage.baseSuccessRate * 10000) +
      player.spiritualRoot * 40 +
      (player.bodyTempering || 0) * 25 +
      player.intelligence * 15 +
      modifiers.breakthroughChanceBps +
      (player.portalBlessingBps || 0);

    chanceBps = clampInt(chanceBps, 0, GameConstants.BREAKTHROUGH_MAX_CHANCE_BPS);

    if (hasAdBuff) {
      chanceBps = clampInt(
        chanceBps + GameConstants.BREAKTHROUGH_AD_BONUS_BPS,
        0,
        GameConstants.BREAKTHROUGH_AD_MAX_CHANCE_BPS
      );
    }

    return chanceBps;
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

    player.consumePortalBlessing();

    const roll = getRandomInt(0, 9999);
    const isSuccess = roll < chanceBps;

    if (isSuccess) {
      player.setCultivationStage(nextStage.id);
      addLog(uiData.log_success.replace('{name}', nextStageName), 'secret');
      pushUiNotification('breakthrough_success', 'reward', {
        name: nextStageName,
      });
    } else {
      if (hasAdBuff) {
        addLog(uiData.log_ad_saved, 'secret');
        pushUiNotification('breakthrough_saved', 'reward');
      } else {
        const nextStageIndex = Math.max(1, currentStageIndex + 1);

        const stageDamageBps =
          typeof (nextStage as any).breakthroughDamageBps === 'number'
            ? (nextStage as any).breakthroughDamageBps
            : 2000;

        const baseDamage = 40 + nextStageIndex * 30;
        const maxHealthDamage = Math.floor(
          (player.maxHealth * Math.min(5000, stageDamageBps)) / 10000
        );
        const rawDamage = Math.max(baseDamage, maxHealthDamage);

        const modifiers = combineModifiers(
          getTechniqueModifiers(techniques.levels || {}),
          getKarmaTotalEffects(inventory.items || {}),
          getCurseModifiers(player.activeCurses || [])
        );

        const bodyReduction = getBodyBreakthroughReductionBps(player.bodyTempering || 0);
        const damageReductionBps = clampInt(
          modifiers.damageReductionBps + bodyReduction,
          0,
          GameConstants.DAMAGE_REDUCTION_CAP_BPS
        );

        const damage = Math.max(
          1,
          Number(reduceBigIntByBps(rawDamage.toString(), damageReductionBps))
        );

        const willDie = player.health <= damage;

        player.applyEffects({ health: -damage });

        const after = usePlayerStore.getState();

        if (after.isDead) {
          after.setDeathCause('breakthrough');
          addLog(uiData.log_fail_death, 'system');
          pushUiNotification('breakthrough_fail_death', 'danger');
        } else if (willDie) {
          addLog(uiData.log_fail_death, 'system');
          pushUiNotification('breakthrough_fail_death', 'danger');
        } else {
          addLog(uiData.log_fail_damage.replace('{damage}', damage.toString()), 'secret');
          pushUiNotification('breakthrough_fail_damage', 'danger', {
            damage: damage.toString(),
          });
        }
      }
    }

    if (hasAdBuff) {
      clearBuff();
    }
  };

  return { attemptBreakthrough, nextStage, calculateChance, nextStageName };
};
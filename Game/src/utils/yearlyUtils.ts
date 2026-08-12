import { GameConstants } from '../constants/GameConstants';
import { LifestyleCategory, LifestyleSelection, LifestyleReport } from '../types';
import { safeBigInt, increaseBigIntByBps, reduceBigIntByBps, clampInt, getRandomInt } from './helpers';
import lifestyleData from '../data/lifestyle.json';
import stagesData from '../data/stages.json';

export type LifePhase =
  | 'infant'
  | 'child'
  | 'teen'
  | 'adult'
  | 'elder'
  | 'qi'
  | 'foundation'
  | 'core'
  | 'immortal';

export const getStageIndex = (stageId: string): number => {
  const index = (stagesData as any[]).findIndex((stage) => stage.id === stageId);
  return 0 > index ? 0 : index;
};

export const getLifePhase = (age: number, stageId: string): LifePhase => {
  if (stageId === 'immortal') {
    return 'immortal';
  }

  if (stageId === 'core_formation') {
    return 'core';
  }

  if (stageId.startsWith('foundation')) {
    return 'foundation';
  }

  if (stageId.startsWith('qi_condensation')) {
    return 'qi';
  }

  if (age < 3) {
    return 'infant';
  }

  if (age < 12) {
    return 'child';
  }

  if (age < 18) {
    return 'teen';
  }

  if (age < 65) {
    return 'adult';
  }

  return 'elder';
};

export const getSurvivalCost = (age: number): bigint => {
  const phase = getLifePhase(age, 'mortal');
  const cost = (GameConstants.SURVIVAL_COST_BY_AGE as any)[phase] ?? 0;
  return BigInt(cost);
};

export const calculateOldAgeDeathBps = (age: number, stageId: string): number => {
  const stage = (stagesData as any[]).find((s) => s.id === stageId);

  if (!stage || !stage.maxAge || stage.maxAge <= 0) {
    return 0;
  }

  if (age < stage.maxAge) {
    return 0;
  }

  const bps =
    GameConstants.OLD_AGE_BASE_DEATH_BPS +
    (age - stage.maxAge) * GameConstants.OLD_AGE_DEATH_BPS_PER_YEAR;

  return Math.min(10000, bps);
};

export const calculateAgeDecay = (age: number, stageId: string): number => {
  const stage = (stagesData as any[]).find((s) => s.id === stageId);

  if (!stage || !stage.maxAge || stage.maxAge <= 0) {
    return 0;
  }

  if (age < stage.softAge) {
    return 0;
  }

  const overSoft = age - stage.softAge;
  let decay = Math.floor(overSoft / GameConstants.AGE_DECAY_DIVISOR) + GameConstants.AGE_DECAY_BASE;

  if (age >= stage.maxAge) {
    decay += GameConstants.AGE_DECAY_MAX_PENALTY;
  }

  return decay;
};

const getLifestyleOptions = (): any[] => {
  const all: any[] = [];
  const data = lifestyleData as any;

  if (!data || !data.categories) {
    return all;
  }

  data.categories.forEach((category: any) => {
    if (category.options) {
      category.options.forEach((option: any) => {
        all.push(option);
      });
    }
  });

  return all;
};

const getOptionById = (optionId: string): any => {
  return getLifestyleOptions().find((o) => o.id === optionId);
};

const meetsLifestyleRequirements = (
  option: any,
  player: {
    age: number;
    intelligence: number;
    appearance: number;
    spiritualRoot: number;
    health: number;
    maxHealth: number;
    cultivationStage: string;
  }
): boolean => {
  const req = option.requirements;

  if (!req) {
    return true;
  }

  if (req.ageMin && player.age < req.ageMin) {
    return false;
  }

  if (req.intelligence && player.intelligence < req.intelligence) {
    return false;
  }

  if (req.appearance && player.appearance < req.appearance) {
    return false;
  }

  if (req.spiritualRoot && player.spiritualRoot < req.spiritualRoot) {
    return false;
  }

  if (req.healthMin && player.health < req.healthMin) {
    return false;
  }

  if (req.maxHealthMin && player.maxHealth < req.maxHealthMin) {
    return false;
  }

  if (req.stage) {
    const reqIndex = getStageIndex(req.stage);
    const curIndex = getStageIndex(player.cultivationStage);

    if (curIndex < reqIndex) {
      return false;
    }
  }

  return true;
};

const calculateJobIncome = (
  option: any,
  player: { intelligence: number; appearance: number }
): string => {
  if (!option.dailyIncome || '0' === option.dailyIncome) {
    return '0';
  }

  const baseIncome = safeBigInt(option.dailyIncome) * BigInt(GameConstants.YEAR_DAYS);

  const intBonusBps = Math.min(8000, player.intelligence * 80);
  const appBonusBps = Math.min(4000, player.appearance * 40);
  let jobBonusBps = intBonusBps + appBonusBps;

  jobBonusBps = clampInt(jobBonusBps, 0, GameConstants.JOB_BONUS_CAP_BPS);

  return increaseBigIntByBps(baseIncome.toString(), jobBonusBps);
};

export const processLifestyleYear = (
  player: {
    money: string;
    health: number;
    maxHealth: number;
    intelligence: number;
    appearance: number;
    spiritualRoot: number;
    cultivationStage: string;
    age: number;
  },
  selection: LifestyleSelection
): LifestyleReport => {
  const disabled: LifestyleCategory[] = [];
  const categories: LifestyleCategory[] = ['job', 'sport', 'food', 'housing', 'portal'];
  const priority: LifestyleCategory[] = ['portal', 'sport', 'housing', 'food', 'job'];

  const active: Record<LifestyleCategory, any> = {
    job: null,
    sport: null,
    food: null,
    housing: null,
    portal: null,
  };

  categories.forEach((cat) => {
    const optionId = selection[cat];

    if (!optionId || `${cat}_none` === optionId) {
      return;
    }

    const option = getOptionById(optionId);

    if (!option) {
      return;
    }

    if (!meetsLifestyleRequirements(option, player)) {
      disabled.push(cat);
      return;
    }

    active[cat] = option;
  });

  const recalc = (): bigint => {
    let totalCost = 0n;
    let totalIncome = 0n;

    categories.forEach((cat) => {
      const option = active[cat];

      if (!option) {
        return;
      }

      totalCost += safeBigInt(option.dailyCost || '0') * BigInt(GameConstants.YEAR_DAYS);

      if (option.portal) {
        totalCost += safeBigInt(option.portal.attemptCost || '0');
      }

      if ('job' === cat) {
        totalIncome += safeBigInt(calculateJobIncome(option, player));
      }
    });

    return totalIncome - totalCost;
  };

  let net = recalc();
  const playerMoney = safeBigInt(player.money);

  while (0n > playerMoney + net) {
    let removed = false;

    for (const cat of priority) {
      if (active[cat]) {
        disabled.push(cat);
        active[cat] = null;
        removed = true;
        break;
      }
    }

    if (!removed) {
      break;
    }

    net = recalc();
  }

  let baseRegen = 0;
  let maxHealthGain = 0;
  let appearanceGain = 0;
  let lifestyleQi = 0n;
  let optionPortalSuccessBps = 0;

  categories.forEach((cat) => {
    const option = active[cat];

    if (!option || !option.effects) {
      return;
    }

    if (option.effects.healthRegenPerYear) {
      baseRegen += option.effects.healthRegenPerYear;
    }

    if (option.effects.maxHealthPerYear) {
      maxHealthGain += option.effects.maxHealthPerYear;
    }

    if (option.effects.appearancePerYear) {
      appearanceGain += option.effects.appearancePerYear;
    }

    if (option.effects.qiPerYear) {
      lifestyleQi += safeBigInt(option.effects.qiPerYear);
    }

    if (option.effects.portalSuccessBps) {
      optionPortalSuccessBps += option.effects.portalSuccessBps;
    }
  });

  maxHealthGain = Math.min(maxHealthGain, GameConstants.MAX_HEALTH_CAP - player.maxHealth);

  const ageDecay = calculateAgeDecay(player.age, player.cultivationStage);

  let portalResult: LifestyleReport['portalResult'] = 'none';
  let portalMoney = '0';
  let portalQi = '0';
  let portalDamage = 0;

  const portalOption = active.portal;

  if (portalOption && portalOption.portal) {
    const portal = portalOption.portal;

    let portalChanceBps =
      portal.successBaseBps +
      player.spiritualRoot * 40 +
      player.intelligence * 20 +
      optionPortalSuccessBps;

    portalChanceBps = clampInt(portalChanceBps, GameConstants.PORTAL_MIN_CHANCE_BPS, GameConstants.PORTAL_MAX_CHANCE_BPS);

    const roll = getRandomInt(0, 9999);
    const success = roll < portalChanceBps;

    if (success) {
      portalResult = 'success';

      const rawMoney = safeBigInt(portal.moneyMin) + ((safeBigInt(portal.moneyMax) - safeBigInt(portal.moneyMin)) / 2n);
      const rawQi = safeBigInt(portal.qiMin) + ((safeBigInt(portal.qiMax) - safeBigInt(portal.qiMin)) / 2n);

      portalMoney = increaseBigIntByBps(rawMoney.toString(), GameConstants.MONEY_BONUS_CAP_BPS / 2);
      portalQi = increaseBigIntByBps(rawQi.toString(), GameConstants.QI_BONUS_CAP_BPS / 4);
    } else {
      portalResult = 'fail';
      portalDamage = Math.max(1, Number(reduceBigIntByBps(portal.failDamage.toString(), 0)));
    }
  }

  const healthDelta = baseRegen + maxHealthGain - ageDecay - portalDamage;

  let moneyDelta = net;

  if ('success' === portalResult) {
    moneyDelta += safeBigInt(portalMoney);
  }

  const qiDelta = lifestyleQi;

  return {
    moneyDelta: moneyDelta.toString(),
    healthDelta,
    maxHealthDelta: maxHealthGain,
    appearanceDelta: appearanceGain,
    qiDelta: qiDelta.toString(),
    disabled,
    portalResult,
    portalMoney,
    portalQi,
    portalDamage,
  };
};
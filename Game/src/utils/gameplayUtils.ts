import { GameConstants } from '../constants/GameConstants';
import { ModifierSet, LifestyleCategory, LifestyleSelection, LifestyleReport } from '../types';
import {
  safeBigInt,
  increaseBigIntByBps,
  reduceBigIntByBps,
  randomBigIntBetween,
  clampInt,
} from './helpers';
import itemsData from '../data/items.json';
import techniquesData from '../data/techniques.json';
import lifestyleData from '../data/lifestyle.json';
import stagesData from '../data/stages.json';

export const emptyModifiers = (): ModifierSet => ({
  moneyGainBps: 0,
  jobIncomeBps: 0,
  qiGainBps: 0,
  breakthroughChanceBps: 0,
  healthRegenBps: 0,
  damageReductionBps: 0,
  portalSuccessBps: 0,
  portalMoneyBps: 0,
});

export const combineModifiers = (...mods: Array<Partial<ModifierSet>>): ModifierSet => {
  const result = emptyModifiers();

  mods.forEach((modifier) => {
    (Object.keys(result) as Array<keyof ModifierSet>).forEach((key) => {
      result[key] += (modifier as any)[key] || 0;
    });
  });

  return result;
};

export const getKarmaItemLevel = (items: Record<string, any>, itemId: string): number => {
  const item = items[itemId];

  if (!item) {
    return 0;
  }

  const karmaItem = (itemsData as any[]).find((i) => i.id === itemId);

  if (!karmaItem) {
    return 0;
  }

  return Math.min(item.quantity || 0, karmaItem.maxLevel || 0);
};

export const getKarmaLevelEffects = (itemId: string, level: number): Record<string, any> => {
  if (0 >= level) {
    return {};
  }

  const item = (itemsData as any[]).find((i) => i.id === itemId);

  if (!item || !item.levels) {
    return {};
  }

  const levelData = item.levels.find((l: any) => l.level === level);
  return levelData ? levelData.effects : {};
};

export const getKarmaTotalEffects = (items: Record<string, any>): ModifierSet & {
  startMoney: string;
  startMaxHealth: number;
  startSpiritualRoot: number;
} => {
  const mods = emptyModifiers();
  let startMoney = 0n;
  let startMaxHealth = 0;
  let startSpiritualRoot = 0;

  (itemsData as any[]).forEach((item) => {
    if (item.type !== 'karma_buff') {
      return;
    }

    const level = getKarmaItemLevel(items, item.id);

    if (0 >= level) {
      return;
    }

    const effects = getKarmaLevelEffects(item.id, level);

    if (effects.startMoney) {
      startMoney += safeBigInt(effects.startMoney);
    }

    if (effects.startMaxHealth) {
      startMaxHealth += effects.startMaxHealth;
    }

    if (effects.startSpiritualRoot) {
      startSpiritualRoot += effects.startSpiritualRoot;
    }

    if (effects.moneyGainBps) {
      mods.moneyGainBps += effects.moneyGainBps;
    }

    if (effects.qiGainBps) {
      mods.qiGainBps += effects.qiGainBps;
    }

    if (effects.breakthroughChanceBps) {
      mods.breakthroughChanceBps += effects.breakthroughChanceBps;
    }

    if (effects.healthRegenBps) {
      mods.healthRegenBps += effects.healthRegenBps;
    }

    if (effects.damageReductionBps) {
      mods.damageReductionBps += effects.damageReductionBps;
    }
  });

  return {
    ...mods,
    startMoney: startMoney.toString(),
    startMaxHealth,
    startSpiritualRoot,
  };
};

export const getTechniqueCost = (techniqueId: string, currentLevel: number): string => {
  const technique = (techniquesData as any[]).find((t) => t.id === techniqueId);

  if (!technique || currentLevel >= technique.maxLevel) {
    return '0';
  }

  let cost = safeBigInt(technique.baseCost);
  const growthBps = technique.costGrowthBps || 0;

  for (let i = 0; i < currentLevel; i += 1) {
    cost = (cost * BigInt(10000 + growthBps) + 9999n) / 10000n;
  }

  return cost.toString();
};

export const getTechniqueModifiers = (levels: Record<string, number>): ModifierSet => {
  const mods = emptyModifiers();

  (techniquesData as any[]).forEach((technique) => {
    const level = levels[technique.id] || 0;

    if (0 >= level) {
      return;
    }

    const effects = technique.effectsPerLevel || {};

    (Object.keys(mods) as Array<keyof ModifierSet>).forEach((key) => {
      if (effects[key] !== undefined) {
        mods[key] += effects[key] * level;
      }
    });
  });

  return mods;
};

export const getStageIndex = (stageId: string): number => {
  const index = (stagesData as any[]).findIndex((s) => s.id === stageId);
  return 0 > index ? 0 : index;
};

export const meetsTechniqueRequirements = (
  techniqueId: string,
  player: { spiritualRoot: number; intelligence: number; cultivationStage: string }
): boolean => {
  const technique = (techniquesData as any[]).find((t) => t.id === techniqueId);

  if (!technique) {
    return false;
  }

  if (technique.requiredSpiritualRoot && player.spiritualRoot < technique.requiredSpiritualRoot) {
    return false;
  }

  if (technique.requiredIntelligence && player.intelligence < technique.requiredIntelligence) {
    return false;
  }

  if (technique.requiredStage) {
    const reqIndex = getStageIndex(technique.requiredStage);
    const curIndex = getStageIndex(player.cultivationStage);

    if (curIndex < reqIndex) {
      return false;
    }
  }

  return true;
};

export const getLifestyleOptions = (): any[] => {
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

export const getOptionById = (optionId: string): any => {
  return getLifestyleOptions().find((o) => o.id === optionId);
};

export const meetsLifestyleRequirements = (
  option: any,
  player: {
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

export const calculateJobIncome = (
  option: any,
  player: { intelligence: number; appearance: number },
  modifiers: ModifierSet
): string => {
  if (!option.dailyIncome || '0' === option.dailyIncome) {
    return '0';
  }

  const baseIncome = safeBigInt(option.dailyIncome) * BigInt(GameConstants.YEAR_DAYS);

  let jobBonusBps =
    player.intelligence * 250 +
    player.appearance * 100 +
    modifiers.jobIncomeBps +
    modifiers.moneyGainBps;

  jobBonusBps = clampInt(jobBonusBps, 0, GameConstants.JOB_BONUS_CAP_BPS);

  return increaseBigIntByBps(baseIncome.toString(), jobBonusBps);
};

export const calculateAgeDecay = (age: number): number => {
  if (18 > age) {
    return 0;
  }

  if (40 > age) {
    return 1;
  }

  if (60 > age) {
    return 2;
  }

  if (80 > age) {
    return 4;
  }

  return 7;
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
  selection: LifestyleSelection,
  baseModifiers: ModifierSet
): LifestyleReport => {
  const disabled: LifestyleCategory[] = [];
  const categories: LifestyleCategory[] = ['job', 'sport', 'food', 'housing', 'portal'];
  const priority: LifestyleCategory[] = ['portal', 'sport', 'housing', 'food', 'job'];

  const activeOptions: Record<LifestyleCategory, any> = {
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

    activeOptions[cat] = option;
  });

  let totalCost = 0n;
  let totalIncome = 0n;

  categories.forEach((cat) => {
    const option = activeOptions[cat];

    if (!option) {
      return;
    }

    const yearCost = safeBigInt(option.dailyCost || '0') * BigInt(GameConstants.YEAR_DAYS);
    totalCost += yearCost;

    if (option.portal) {
      totalCost += safeBigInt(option.portal.attemptCost || '0');
    }

    if ('job' === cat) {
      const income = calculateJobIncome(option, player, baseModifiers);
      totalIncome += safeBigInt(income);
    }
  });

  let net = totalIncome - totalCost;
  let playerMoney = safeBigInt(player.money);

  while (0n > playerMoney + net && activeOptions) {
    let removed = false;

    for (const cat of priority) {
      if (activeOptions[cat]) {
        disabled.push(cat);
        activeOptions[cat] = null;
        removed = true;
        break;
      }
    }

    if (!removed) {
      break;
    }

    totalCost = 0n;
    totalIncome = 0n;

    categories.forEach((cat) => {
      const option = activeOptions[cat];

      if (!option) {
        return;
      }

      const yearCost = safeBigInt(option.dailyCost || '0') * BigInt(GameConstants.YEAR_DAYS);
      totalCost += yearCost;

      if (option.portal) {
        totalCost += safeBigInt(option.portal.attemptCost || '0');
      }

      if ('job' === cat) {
        const income = calculateJobIncome(option, player, baseModifiers);
        totalIncome += safeBigInt(income);
      }
    });

    net = totalIncome - totalCost;
  }

  const lifestyleModifiers = { ...baseModifiers };

  categories.forEach((cat) => {
    const option = activeOptions[cat];

    if (!option || !option.effects) {
      return;
    }

    if (option.effects.portalSuccessBps) {
      lifestyleModifiers.portalSuccessBps += option.effects.portalSuccessBps;
    }
  });

  let baseRegen = 0;
  let maxHealthGain = 0;
  let appearanceGain = 0;
  let lifestyleQi = 0n;

  categories.forEach((cat) => {
    const option = activeOptions[cat];

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
  });

  const effectiveRegen = Number(increaseBigIntByBps(baseRegen.toString(), lifestyleModifiers.healthRegenBps));

  maxHealthGain = Math.min(maxHealthGain, GameConstants.MAX_HEALTH_CAP - player.maxHealth);

  const ageDecay = calculateAgeDecay(player.age);

  let portalResult: LifestyleReport['portalResult'] = 'none';
  let portalMoney = '0';
  let portalQi = '0';
  let portalDamage = 0;

  const portalOption = activeOptions.portal;

  if (portalOption && portalOption.portal) {
    const portal = portalOption.portal;

    let portalChanceBps =
      portal.successBaseBps +
      player.spiritualRoot * 40 +
      player.intelligence * 20 +
      lifestyleModifiers.portalSuccessBps;

    portalChanceBps = clampInt(portalChanceBps, GameConstants.PORTAL_MIN_CHANCE_BPS, GameConstants.PORTAL_MAX_CHANCE_BPS);

    const roll = Math.floor(Math.random() * 10000);
    const success = roll < portalChanceBps;

    if (success) {
      portalResult = 'success';

      const rawMoney = randomBigIntBetween(portal.moneyMin, portal.moneyMax);
      const rawQi = randomBigIntBetween(portal.qiMin, portal.qiMax);

      let moneyBonusBps = clampInt(lifestyleModifiers.moneyGainBps + lifestyleModifiers.portalMoneyBps, 0, GameConstants.MONEY_BONUS_CAP_BPS);
      let qiBonusBps = clampInt(lifestyleModifiers.qiGainBps, 0, GameConstants.QI_BONUS_CAP_BPS);

      portalMoney = increaseBigIntByBps(rawMoney, moneyBonusBps);
      portalQi = increaseBigIntByBps(rawQi, qiBonusBps);
    } else {
      portalResult = 'fail';

      let damageReductionBps = clampInt(lifestyleModifiers.damageReductionBps, 0, GameConstants.DAMAGE_REDUCTION_CAP_BPS);
      const reducedDamage = reduceBigIntByBps(portal.failDamage.toString(), damageReductionBps);
      portalDamage = Math.max(1, Number(reducedDamage));
    }
  }

  const healthDelta = effectiveRegen + maxHealthGain - ageDecay - portalDamage;

  let moneyDelta = totalIncome - totalCost;

  if ('success' === portalResult) {
    moneyDelta += safeBigInt(portalMoney);
  }

  const qiDelta = increaseBigIntByBps(lifestyleQi.toString(), lifestyleModifiers.qiGainBps);

  return {
    moneyDelta: moneyDelta.toString(),
    healthDelta,
    maxHealthDelta: maxHealthGain,
    appearanceDelta: appearanceGain,
    qiDelta,
    disabled,
    portalResult,
    portalMoney,
    portalQi,
    portalDamage,
  };
};
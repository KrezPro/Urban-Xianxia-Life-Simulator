import { GameConstants } from '../constants/GameConstants';
import { ModifierSet, LifestyleCategory, LifestyleSelection, LifestyleReport } from '../types';
import { safeBigInt, clampInt, getRandomInt, reduceBigIntByBps } from './helpers';
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
  moneyFlatPerYear: 0,
  qiFlatPerYear: 0,
  healthRegenFlat: 0,
  maxHealthFlat: 0,
  illnessResistanceBps: 0,
});

export const combineModifiers = (
  ...mods: Array<Partial<ModifierSet> | undefined | null>
): ModifierSet => {
  const result = emptyModifiers();
  mods.forEach((modifier) => {
    if (!modifier) {
      return;
    }
    (Object.keys(result) as Array<keyof ModifierSet>).forEach((key) => {
      result[key] += (modifier as any)[key] || 0;
    });
  });
  return result;
};

export const getStageIndex = (stageId: string): number => {
  const index = (stagesData as any[]).findIndex((stage) => stage.id === stageId);
  return 0 > index ? 0 : index;
};

export const getStageDefinition = (stageId: string): any => {
  return (
    (stagesData as any[]).find((stage) => stage.id === stageId) || (stagesData as any[])[0] || {}
  );
};

export const getStageMeditationMultiplier = (stageId: string): number => {
  const stage = getStageDefinition(stageId);
  return typeof stage.qiMeditationMultiplier === 'number' ? stage.qiMeditationMultiplier : 1;
};

export const getBodyTemperCost = (level: number): bigint => {
  const n = BigInt(level + 1);
  return (
    BigInt(GameConstants.BODY_TEMPERING.COST_QI_BASE) * n * n +
    BigInt(GameConstants.BODY_TEMPERING.COST_QI_LINEAR) * n
  );
};

export const getBodyTemperMoneyCost = (level: number): bigint => {
  const qiCost = getBodyTemperCost(level);
  return qiCost * BigInt(GameConstants.BODY_TEMPERING.COST_MONEY_MULTIPLIER);
};

export const getBodyRegenPerYear = (level: number): number => {
  if (0 >= level) {
    return 0;
  }
  return 1 + Math.floor(level / GameConstants.BODY_TEMPERING.REGEN_DIVISOR);
};

export const getBodyIllnessResistanceBps = (level: number): number => {
  return clampInt(
    level * GameConstants.BODY_TEMPERING.ILLNESS_RESISTANCE_PER_LEVEL_BPS,
    0,
    GameConstants.BODY_TEMPERING.ILLNESS_RESISTANCE_CAP_BPS
  );
};

export const getBodyMortalityReductionBps = (level: number): number => {
  return clampInt(
    level * GameConstants.BODY_TEMPERING.MORTALITY_REDUCTION_PER_LEVEL_BPS,
    0,
    GameConstants.BODY_TEMPERING.MORTALITY_REDUCTION_CAP_BPS
  );
};

export const getBodySurvivalReductionBps = (level: number): number => {
  return clampInt(
    level * GameConstants.BODY_TEMPERING.SURVIVAL_REDUCTION_PER_LEVEL_BPS,
    0,
    GameConstants.BODY_TEMPERING.SURVIVAL_REDUCTION_CAP_BPS
  );
};

export const getBodyBreakthroughReductionBps = (level: number): number => {
  return clampInt(
    level * GameConstants.BODY_TEMPERING.BREAKTHROUGH_REDUCTION_PER_LEVEL_BPS,
    0,
    GameConstants.BODY_TEMPERING.BREAKTHROUGH_REDUCTION_CAP_BPS
  );
};

export const getBodyPortalReductionBps = (level: number): number => {
  return clampInt(
    level * GameConstants.BODY_TEMPERING.PORTAL_REDUCTION_PER_LEVEL_BPS,
    0,
    GameConstants.BODY_TEMPERING.PORTAL_REDUCTION_CAP_BPS
  );
};

export const getBodyEventDamageReductionBps = (level: number): number => {
  return clampInt(
    level * GameConstants.BODY_TEMPERING.EVENT_DAMAGE_REDUCTION_PER_LEVEL_BPS,
    0,
    GameConstants.BODY_TEMPERING.EVENT_DAMAGE_REDUCTION_CAP_BPS
  );
};

export const getBodyEffects = (level: number) => {
  return {
    level,
    maxHealth: level * GameConstants.BODY_TEMPERING.MAX_HEALTH_PER_LEVEL,
    regenPerYear: getBodyRegenPerYear(level),
    illnessResistanceBps: getBodyIllnessResistanceBps(level),
    mortalityReductionBps: getBodyMortalityReductionBps(level),
    survivalReductionBps: getBodySurvivalReductionBps(level),
    breakthroughReductionBps: getBodyBreakthroughReductionBps(level),
    portalReductionBps: getBodyPortalReductionBps(level),
  };
};

export const getKarmaItemLevel = (
  items: Record<string, any> | undefined | null,
  itemId: string
): number => {
  if (!items) {
    return 0;
  }
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

export const getKarmaTotalEffects = (
  items: Record<string, any> | undefined | null
): ModifierSet & {
  startMoney: string;
  startMaxHealth: number;
  startSpiritualRoot: number;
  startBodyTempering: number;
} => {
  const mods = emptyModifiers();
  let startMoney = 0n;
  let startMaxHealth = 0;
  let startSpiritualRoot = 0;
  let startBodyTempering = 0;
  const safeItems = items || {};

  (itemsData as any[]).forEach((item) => {
    if (item.type !== 'karma_buff') {
      return;
    }
    const level = getKarmaItemLevel(safeItems, item.id);
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
    if (effects.startBodyTempering) {
      startBodyTempering += effects.startBodyTempering;
    }

    (Object.keys(mods) as Array<keyof ModifierSet>).forEach((key) => {
      const value = effects[key as string];
      if (typeof value === 'number') {
        mods[key] += value;
      }
    });
  });

  return {
    ...mods,
    startMoney: startMoney.toString(),
    startMaxHealth,
    startSpiritualRoot,
    startBodyTempering,
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

export const getTechniqueModifiers = (
  levels: Record<string, number> | undefined | null
): ModifierSet => {
  const mods = emptyModifiers();
  const safeLevels = levels || {};

  (techniquesData as any[]).forEach((technique) => {
    const level = safeLevels[technique.id] || 0;
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

export const calculateJobIncome = (
  option: any,
  player: { intelligence: number; appearance: number },
  modifiers: ModifierSet
): string => {
  if (!option.dailyIncome || '0' === option.dailyIncome) {
    return '0';
  }
  const baseIncome = safeBigInt(option.dailyIncome) * BigInt(GameConstants.YEAR_DAYS);
  const statBonus = Math.min(
    GameConstants.JOB_STAT_BONUS_FLAT_CAP,
    player.intelligence * 80 + player.appearance * 30
  );
  const flatBonus = clampInt(modifiers.moneyFlatPerYear, 0, GameConstants.MONEY_FLAT_CAP);
  return (baseIncome + BigInt(statBonus) + BigInt(flatBonus)).toString();
};

export const getLifestyleAnnualCost = (option: any): bigint => {
  if (!option) {
    return 0n;
  }
  let cost = safeBigInt(option.dailyCost || '0') * BigInt(GameConstants.YEAR_DAYS);
  if (option.portal && option.portal.attemptCost) {
    cost += safeBigInt(option.portal.attemptCost);
  }
  return cost;
};

export const getLifestyleAnnualIncome = (
  option: any,
  player: { intelligence: number; appearance: number },
  modifiers: ModifierSet
): bigint => {
  if (!option || option.category !== 'job') {
    return 0n;
  }
  return safeBigInt(calculateJobIncome(option, player, modifiers));
};

export const getLifestyleProjectedNet = (
  selection: LifestyleSelection | undefined | null,
  player: { money: string; intelligence: number; appearance: number },
  modifiers: ModifierSet
): bigint => {
  const safeSelection: LifestyleSelection = {
    job: 'job_none',
    sport: 'sport_none',
    food: 'food_none',
    housing: 'housing_none',
    portal: 'portal_none',
    ...(selection || {}),
  };
  let net = safeBigInt(player.money);
  (Object.keys(safeSelection) as LifestyleCategory[]).forEach((category) => {
    const option = getOptionById(safeSelection[category]);
    if (!option) {
      return;
    }
    net += getLifestyleAnnualIncome(option, player, modifiers);
    net -= getLifestyleAnnualCost(option);
  });
  return net;
};

export const canAffordLifestyleSelection = (
  selection: LifestyleSelection | undefined | null,
  player: { money: string; intelligence: number; appearance: number },
  modifiers: ModifierSet
): boolean => {
  return getLifestyleProjectedNet(selection, player, modifiers) >= 0n;
};

export const canAffordLifestyleOption = (
  category: LifestyleCategory,
  optionId: string,
  currentSelection: LifestyleSelection | undefined | null,
  player: { money: string; intelligence: number; appearance: number },
  modifiers: ModifierSet
): boolean => {
  const safeSelection: LifestyleSelection = {
    job: 'job_none',
    sport: 'sport_none',
    food: 'food_none',
    housing: 'housing_none',
    portal: 'portal_none',
    ...(currentSelection || {}),
  };
  const nextSelection: LifestyleSelection = {
    ...safeSelection,
    [category]: optionId,
  };
  return canAffordLifestyleSelection(nextSelection, player, modifiers);
};

export const calculateAgeDecay = (age: number, stageId: string): number => {
  const stage = getStageDefinition(stageId);
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

export const calculateOldAgeDeathBps = (age: number, stageId: string): number => {
  const stage = getStageDefinition(stageId);
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

export const getSurvivalCost = (age: number, stageId: string): bigint => {
  let base = 0n;
  if (age < 3) {
    base = BigInt(GameConstants.SURVIVAL_COST.INFANT);
  } else if (age < 12) {
    base = BigInt(GameConstants.SURVIVAL_COST.CHILD);
  } else if (age < 18) {
    base = BigInt(GameConstants.SURVIVAL_COST.TEEN);
  } else if (age < 65) {
    base = BigInt(GameConstants.SURVIVAL_COST.ADULT);
  } else {
    base = BigInt(GameConstants.SURVIVAL_COST.ELDER);
  }
  const stage = getStageDefinition(stageId);
  const survivalCostBps =
    typeof stage.survivalCostBps === 'number' ? stage.survivalCostBps : 10000;
  return (base * BigInt(survivalCostBps)) / 10000n;
};

export const calculateUnpaidSurvivalDamage = (
  unpaidBps: number,
  age: number,
  maxHealth: number,
  bodyTempering: number
): number => {
  const reduction = getBodySurvivalReductionBps(bodyTempering);
  const damageBps = Math.max(0, GameConstants.UNPAID_SURVIVAL_DAMAGE_BPS - reduction);
  let damage = Math.max(1, Math.floor((maxHealth * damageBps) / 10000));
  if (age < 12) {
    damage += 2;
  }
  if (age >= 65) {
    damage += 3;
  }
  return damage;
};

const getAgeMortalityBase = (age: number): number => {
  if (age <= 0) {
    return 300;
  }
  if (age <= 4) {
    return 180;
  }
  if (age <= 12) {
    return 90;
  }
  if (age <= 17) {
    return 45;
  }
  if (age <= 39) {
    return 12;
  }
  if (age <= 54) {
    return 35;
  }
  if (age <= 69) {
    return 90;
  }
  return Math.min(5000, 120 + (age - 70) * 30);
};

export const calculateAgeStageDeathBps = (
  age: number,
  stageId: string,
  health: number,
  maxHealth: number,
  bodyTempering: number
): number => {
  const stage = getStageDefinition(stageId);
  const mortalityBps = typeof stage.mortalityBps === 'number' ? stage.mortalityBps : 10000;
  if (mortalityBps <= 0) {
    return 0;
  }
  const base = getAgeMortalityBase(age);
  const stageAdjusted = Math.floor((base * mortalityBps) / 10000);
  const reduction = getBodyMortalityReductionBps(bodyTempering);
  const safeMaxHealth = maxHealth > 0 ? maxHealth : 100;
  const healthPercent = Math.max(0, Math.min(100, (health / safeMaxHealth) * 100));
  let healthPenalty = 0;
  if (healthPercent < 40) {
    healthPenalty = Math.floor((40 - healthPercent) * 20);
  }
  return clampInt(Math.max(0, stageAdjusted - reduction + healthPenalty), 0, 10000);
};

export const calculateMeditationQi = (
  player: { spiritualRoot: number; cultivationStage: string },
  modifiers: ModifierSet
): string => {
  const stageMultiplier = getStageMeditationMultiplier(player.cultivationStage);
  const baseQi = Math.max(
    0,
    Math.floor(player.spiritualRoot * GameConstants.MEDITATION_QI_MULTIPLIER * stageMultiplier)
  );
  const flatQi = clampInt(modifiers.qiFlatPerYear, 0, GameConstants.QI_FLAT_CAP);
  return (BigInt(baseQi) + BigInt(flatQi)).toString();
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
    bodyTempering?: number;
  },
  selection: LifestyleSelection,
  baseModifiers: ModifierSet
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
      totalCost += getLifestyleAnnualCost(option);
      if ('job' === cat) {
        totalIncome += safeBigInt(calculateJobIncome(option, player, baseModifiers));
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

  const optionModifiers = emptyModifiers();
  let baseRegen = 0;
  let maxHealthGain = 0;
  let appearanceGain = 0;
  let lifestyleQi = 0n;

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
      optionModifiers.portalSuccessBps += option.effects.portalSuccessBps;
    }
  });

  const modifiers = combineModifiers(baseModifiers, optionModifiers);
  const flatRegen = clampInt(modifiers.healthRegenFlat, 0, GameConstants.HEALTH_REGEN_FLAT_CAP);
  const bodyRegen = getBodyRegenPerYear(player.bodyTempering || 0);
  const effectiveRegen = baseRegen + flatRegen + bodyRegen;
  maxHealthGain = Math.min(maxHealthGain, GameConstants.MAX_HEALTH_CAP - player.maxHealth);
  const ageDecay = calculateAgeDecay(player.age, player.cultivationStage);

  let portalResult: LifestyleReport['portalResult'] = 'none';
  let portalMoney = '0';
  let portalQi = '0';
  let portalDamage = 0;
  let portalBlessingGainedBps = 0;

  const portalOption = active.portal;
  if (portalOption && portalOption.portal) {
    const portal = portalOption.portal;
    let portalChanceBps =
      portal.successBaseBps +
      player.spiritualRoot * 20 +
      player.intelligence * 10 +
      modifiers.portalSuccessBps;
    portalChanceBps = clampInt(
      portalChanceBps,
      GameConstants.PORTAL_MIN_CHANCE_BPS,
      GameConstants.PORTAL_MAX_CHANCE_BPS
    );

    const roll = getRandomInt(0, 9999);
    const success = roll < portalChanceBps;

    if (success) {
      portalResult = 'success';
      const rawMoney =
        safeBigInt(portal.moneyMin) +
        (safeBigInt(portal.moneyMax) - safeBigInt(portal.moneyMin)) / 2n;
      const rawQi =
        safeBigInt(portal.qiMin) + (safeBigInt(portal.qiMax) - safeBigInt(portal.qiMin)) / 2n;
      portalMoney = rawMoney.toString();
      portalQi = rawQi.toString();
      portalBlessingGainedBps =
        typeof portal.breakthroughBlessingBps === 'number' && portal.breakthroughBlessingBps > 0
          ? Math.floor(portal.breakthroughBlessingBps)
          : 0;
    } else {
      portalResult = 'fail';
      const bodyReduction = getBodyPortalReductionBps(player.bodyTempering || 0);
      const damageReductionBps = clampInt(
        modifiers.damageReductionBps + bodyReduction,
        0,
        GameConstants.DAMAGE_REDUCTION_CAP_BPS
      );
      const reducedDamage = reduceBigIntByBps(portal.failDamage.toString(), damageReductionBps);
      portalDamage = Math.max(1, Number(reducedDamage));
    }
  }

  const flatQi = clampInt(modifiers.qiFlatPerYear, 0, GameConstants.QI_FLAT_CAP);
  let qiDelta = lifestyleQi + BigInt(flatQi);
  if ('success' === portalResult) {
    qiDelta += safeBigInt(portalQi);
  }

  const healthDelta = effectiveRegen + maxHealthGain - ageDecay - portalDamage;
  let moneyDelta = net;
  if ('success' === portalResult) {
    moneyDelta += safeBigInt(portalMoney);
  }

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
    portalBlessingGainedBps,
  };
};
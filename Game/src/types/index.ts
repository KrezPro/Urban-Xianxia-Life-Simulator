export type Locale = 'ru' | 'en';
export type ActivityFocus = 'mundane' | 'secret';
export type SectFocus = 'mundane' | 'secret' | 'hybrid';
export type SectRole = 'founder' | 'elder' | 'member';
export type NotificationType = 'mundane' | 'secret' | 'system' | 'reward' | 'danger' | 'social';
export type NotificationKind = 'ui' | 'event' | 'generated';
export type EventRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type EventTone = 'positive' | 'negative' | 'neutral';
export type LifestyleCategory = 'job' | 'sport' | 'food' | 'housing' | 'portal';
export type LifestyleSelection = Record<LifestyleCategory, string>;

export interface EffectChip {
  stat: 'intelligence' | 'health' | 'maxHealth' | 'appearance' | 'money' | 'qi' | 'karma';
  amount: string;
  positive: boolean;
}

export interface GeneratedEvent {
  id: string;
  pool: 'mundane' | 'secret';
  category: string;
  rarity: EventRarity;
  tone: EventTone;
  titleKey: string;
  textKey: string;
  params: Record<string, string | number>;
  effects: {
    intelligence?: number;
    health?: number;
    maxHealth?: number;
    appearance?: number;
    karma?: number;
    money?: string;
    qi?: string;
  };
  displayEffects: EffectChip[];
  logType: 'mundane' | 'secret' | 'system';
}

export interface IPlayer {
  age: number;
  intelligence: number;
  health: number;
  maxHealth: number;
  appearance: number;
  money: string;
  qi: string;
  karma: string;
  spiritualRoot: number;
  cultivationStage: string;
}

export interface IEventLog {
  id: string;
  text: string;
  timestamp: number;
  type: 'mundane' | 'secret' | 'system';
  generated?: boolean;
  textKey?: string;
  params?: Record<string, string | number>;
  effects?: EffectChip[];
  rarity?: EventRarity;
}

export interface IItem {
  id: string;
  name?: string;
  quantity: number;
  type: 'pill' | 'artifact' | 'property' | 'karma_buff' | 'social';
}

export interface ISectMember {
  id: string;
  name: string;
  role: SectRole;
  contribution: string;
  influence: string;
}

export interface ISect {
  id: string;
  name: string;
  tag: string;
  inviteCode: string;
  focus: SectFocus;
  funds: string;
  influence: string;
  members: ISectMember[];
  createdAt: number;
  seasonId: string;
}

export interface ILeaderboardEntry {
  id: string;
  name: string;
  tag: string;
  score: string;
  isPlayer?: boolean;
}

export interface ISectTemplate {
  id: string;
  name: string;
  tag: string;
  focus: SectFocus;
  baseFunds: string;
  baseInfluence: string;
}

export interface INotification {
  id: string;
  kind: NotificationKind;
  messageKey: string;
  eventPool?: 'mundane' | 'secret';
  params?: Record<string, string>;
  type: NotificationType;
  createdAt: number;
  durationMs: number;
  priority?: number;
  group?: string;
  titleKey?: string;
  textKey?: string;
  effects?: EffectChip[];
  rarity?: EventRarity;
  tone?: EventTone;
  dictionary?: 'notifications' | 'eventGenerator' | 'rebirth';
}

export interface ModifierSet {
  moneyGainBps: number;
  jobIncomeBps: number;
  qiGainBps: number;
  breakthroughChanceBps: number;
  healthRegenBps: number;
  damageReductionBps: number;
  portalSuccessBps: number;
  portalMoneyBps: number;
}

export interface LifestyleReport {
  moneyDelta: string;
  healthDelta: number;
  maxHealthDelta: number;
  appearanceDelta: number;
  qiDelta: string;
  disabled: LifestyleCategory[];
  portalResult: 'none' | 'success' | 'fail';
  portalMoney: string;
  portalQi: string;
  portalDamage: number;
}
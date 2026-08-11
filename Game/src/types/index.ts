export type Locale = 'ru' | 'en';
export type ActivityFocus = 'mundane' | 'secret';
export type SectFocus = 'mundane' | 'secret' | 'hybrid';
export type SectRole = 'founder' | 'elder' | 'member';

export interface IPlayer {
  age: number;
  intelligence: number;
  health: number;
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
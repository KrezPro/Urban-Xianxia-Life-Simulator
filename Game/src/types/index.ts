export type Locale = 'ru' | 'en';
export type ActivityFocus = 'mundane' | 'secret';

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
export interface IPlayer {
  age: number;
  intelligence: number;
  health: number;
  appearance: number;
  money: bigint; // BigInt для защиты от переполнения на late-game
  qi: bigint;    // BigInt для защиты от переполнения на late-game
  karma: number;
  spiritualRoot: number;
  cultivationStage: string;
}

export interface IEventLog {
  id: string;
  age: number;
  text: string; // В будущем здесь будет лежать ключ перевода (например, "events:mundane.boss_conflict")
  type: 'mundane' | 'cultivation' | 'system';
  timestamp: number;
}

export interface IItem {
  id: string;
  name: string; // Ключ перевода
  quantity: number;
  type: 'pill' | 'artifact' | 'property';
}
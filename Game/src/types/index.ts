export interface IPlayer {
    age: number;
    health: number;
    intellect: number;
    charm: number;
    money: number;

    // Тайные статы
    qi: string; 
    spiritualRoot: string;
    karma: number;
    cultivationStage: string;
}

export interface IEvent {
    id: string;
    title: string;
    description: string;
    type: 'mundane' | 'secret';
    timestamp: number;
}

export interface IItem {
    id: string;
    name: string;
    type: 'pill' | 'artifact' | 'property';
    description: string;
    cost: number;
    effect: Record<string, number | string>;
}
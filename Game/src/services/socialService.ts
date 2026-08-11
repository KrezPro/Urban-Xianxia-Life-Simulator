import { ISect, ISectMember } from '../types';
import { getRandomInt, pickRandom } from '../utils/randomUtils';
import { safeBigInt } from '../utils/bigIntUtils';
import { codeToSeed } from './inviteCodeService';
import sectsData from '../data/sects.json';

const npcNames: string[] = (sectsData as any).npcNames || [];
const templates: any[] = (sectsData as any).templates || [];

const createNpcMembers = (count: number): ISectMember[] => {
  return Array.from({ length: count }).map((_, index) => {
    const name = pickRandom(npcNames) || `Adept ${index + 1}`;

    return {
      id: `npc_${Date.now().toString()}_${index.toString()}`,
      name,
      role: 'member',
      contribution: '0',
      influence: '0',
    };
  });
};

export const createPlayerSect = (params: {
  name: string;
  tag: string;
  inviteCode: string;
  seasonId: string;
}): ISect => {
  const playerMember: ISectMember = {
    id: 'player',
    name: 'player_name',
    role: 'founder',
    contribution: '0',
    influence: '0',
  };

  return {
    id: `sect_${Date.now().toString()}`,
    name: params.name,
    tag: params.tag,
    inviteCode: params.inviteCode,
    focus: 'hybrid',
    funds: '1000',
    influence: '100',
    members: [playerMember, ...createNpcMembers(getRandomInt(3, 5))],
    createdAt: Date.now(),
    seasonId: params.seasonId,
  };
};

export const createNpcSectFromCode = (code: string, seasonId: string): ISect => {
  const seed = codeToSeed(code);
  const template = templates.length > 0
    ? templates[seed % templates.length]
    : {
        id: 'shadow_syndicate',
        name: 'Shadow Syndicate',
        tag: 'SS',
        focus: 'secret',
        baseFunds: '5000',
        baseInfluence: '300',
      };

  const playerMember: ISectMember = {
    id: 'player',
    name: 'player_name',
    role: 'member',
    contribution: '0',
    influence: '0',
  };

  return {
    id: `sect_${code}`,
    name: template.name,
    tag: template.tag,
    inviteCode: code,
    focus: template.focus,
    funds: template.baseFunds,
    influence: template.baseInfluence,
    members: [playerMember, ...createNpcMembers(getRandomInt(4, 6))],
    createdAt: Date.now(),
    seasonId,
  };
};

export const simulateNpcProgress = (sect: ISect, elapsedSeconds: number): ISect => {
  const npcMembers = sect.members.filter((member) => member.id !== 'player');

  if (0 === npcMembers.length || 0 >= elapsedSeconds) {
    return sect;
  }

  const fundsGain = BigInt(elapsedSeconds) * BigInt(npcMembers.length);
  const influenceGain = BigInt(Math.floor(elapsedSeconds / 60)) * BigInt(npcMembers.length);

  return {
    ...sect,
    funds: (safeBigInt(sect.funds) + fundsGain).toString(),
    influence: (safeBigInt(sect.influence) + influenceGain).toString(),
  };
};
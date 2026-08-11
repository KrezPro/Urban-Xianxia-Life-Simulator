import { ILeaderboardEntry, ISect, ISectMember } from '../types';
import { GameConstants } from '../constants/GameConstants';
import {
  addBigIntStrings,
  divideBigIntStringByNumber,
  getRandomInt,
  pickRandom,
  safeBigInt,
} from '../utils/helpers';
import sectsData from '../data/sects.json';
import rankingsData from '../data/rankings.json';

const allowedInviteChars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const npcNames: string[] = (sectsData as any).npcNames || [];
const templates: any[] = (sectsData as any).templates || [];

export const getCurrentSeasonId = (): string => {
  return new Date().toISOString().slice(0, 7);
};

export const generateInviteCode = (): string => {
  return Array.from({ length: GameConstants.SOCIAL_INVITE_CODE_LENGTH })
    .map(() => allowedInviteChars.charAt(Math.floor(Math.random() * allowedInviteChars.length)))
    .join('');
};

export const normalizeInviteCode = (code: string): string => {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, '');
};

export const isValidInviteCode = (code: string): boolean => {
  return /^[A-Z0-9]{8}$/.test(code);
};

export const codeToSeed = (code: string): number => {
  return normalizeInviteCode(code)
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
};

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

  const fallbackTemplate = {
    id: 'shadow_syndicate',
    name: 'Shadow Syndicate',
    tag: 'SS',
    focus: 'secret',
    baseFunds: '5000',
    baseInfluence: '300',
  };

  const template = 0 === templates.length
    ? fallbackTemplate
    : templates[seed % templates.length];

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

  const perMemberFunds = BigInt(elapsedSeconds);
  const perMemberInfluence = BigInt(Math.floor(elapsedSeconds / 60));
  const fundsGain = perMemberFunds * BigInt(npcMembers.length);
  const influenceGain = perMemberInfluence * BigInt(npcMembers.length);

  const members = sect.members.map((member) => {
    if (member.id === 'player') {
      return member;
    }

    return {
      ...member,
      contribution: addBigIntStrings(member.contribution, perMemberFunds.toString()),
      influence: addBigIntStrings(member.influence, perMemberInfluence.toString()),
    };
  });

  return {
    ...sect,
    funds: addBigIntStrings(sect.funds, fundsGain.toString()),
    influence: addBigIntStrings(sect.influence, influenceGain.toString()),
    members,
  };
};

const calculateSectScore = (sect: ISect): string => {
  const influencePart = sect.influence;
  const fundsPart = divideBigIntStringByNumber(sect.funds, 1000);
  return addBigIntStrings(influencePart, fundsPart);
};

export const buildLeaderboard = (playerSect: ISect | null): ILeaderboardEntry[] => {
  const entries: ILeaderboardEntry[] = (rankingsData as any[]).map((row: any) => ({
    id: row.id,
    name: row.name,
    tag: row.tag,
    score: row.score,
    isPlayer: false,
  }));

  if (playerSect) {
    entries.push({
      id: playerSect.id,
      name: playerSect.name,
      tag: playerSect.tag,
      score: calculateSectScore(playerSect),
      isPlayer: true,
    });
  }

  return entries
    .sort((a, b) => {
      const av = safeBigInt(a.score);
      const bv = safeBigInt(b.score);

      if (av > bv) {
        return -1;
      }

      if (bv > av) {
        return 1;
      }

      return 0;
    })
    .slice(0, GameConstants.SOCIAL_LEADERBOARD_LIMIT);
};
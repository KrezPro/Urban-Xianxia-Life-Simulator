import { ILeaderboardEntry, ISect } from '../types';
import { safeBigInt, addBigIntStrings, divideBigIntStringByNumber } from '../utils/bigIntUtils';
import { GameConstants } from '../constants/GameConstants';
import rankingsData from '../data/rankings.json';

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
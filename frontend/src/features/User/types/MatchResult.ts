export type MatchType = 'RANK' | 'CASUAL' | 'PRIVATE';

export type MatchResult = {
  startAt: Date;
  endAt: Date;
  id: string;
  matchStatus: 'PREPARING' | 'IN_PROGRESS' | 'DONE' | 'ERROR';
  matchType: MatchType;
  userId1: number;
  userId2: number;
  userScore1: number;
  userScore2: number;
  config: MatchConfig;
};

export const GameSpeedFactors = ['x050', 'x100', 'x125', 'x150'] as const;
export type GameSpeedFactor = typeof GameSpeedFactors[number];
export const GameSpeedFactor = {
  x050: 0.5,
  x100: 1.0,
  x125: 1.25,
  x150: 1.5,
};

export type MatchConfig = {
  maxScore: number;
  speed: GameSpeedFactor;
};

export type Stats = {
  winMatchCount: number;
  loseMatchCount: number;
  winRate: number;
  rankPlace: number;
};

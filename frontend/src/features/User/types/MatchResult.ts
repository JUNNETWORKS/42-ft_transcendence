export type MatchResult = {
  startAt: Date;
  endAt: Date;
  id: string;
  matchStatus: 'PREPARING' | 'IN_PROGRESS' | 'DONE' | 'ERROR';
  matchType: 'RANK' | 'CASUAL' | 'PRIVATE';
  userID1: number;
  userID2: number;
  userScore1: number;
  userScore2: number;
  config: MatchConfig;
};

export type MatchConfig = {
  maxScore: number;
  speed: number;
};

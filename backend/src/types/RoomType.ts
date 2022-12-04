export type RoomType = 'ChatRoom' | 'Match' | 'MatchMaking' | 'User' | 'Global';

export type RoomName = string;

export type RoomArg =
  | { roomId: number }
  | { matchId: string }
  | { matchMakingId: string }
  | { userId: number }
  | { global: string };

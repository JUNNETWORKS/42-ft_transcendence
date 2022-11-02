export type RoomType = 'ChatRoom' | 'Match' | 'User' | 'Global';

export type RoomName = string;

export type RoomArg =
  | { roomId: number }
  | { matchId: string }
  | { userId: number }
  | { global: string };

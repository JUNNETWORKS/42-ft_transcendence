export type RoomType = 'ChatRoom' | 'User' | 'Global';

export type RoomName = string;

export type RoomArg =
  | { roomId: number }
  | { userId: number }
  | { global: string };

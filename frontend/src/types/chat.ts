export type RoomType = 'PUBLIC' | 'PRIVATE' | 'LOCKED' | 'DM';

export type ChatRoom = {
  id: number;
  roomName: string;
  rootType: RoomType;
  ownerId: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ChatMessage = {
  id: number;
  chatRoomId: number;
  userId: number;
  createdAt: Date;
  content: string;
};

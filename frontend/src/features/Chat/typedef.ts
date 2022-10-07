import * as Utils from '@/utils';

// 仮の型定義

export type User = {
  id: number;
  displayName: string;
};

export type ChatUserRelation = {
  user: User;
  userId: number;
  chatRoomId: number;
  memberType: string; // TODO: ほんとはenum
};

export type ChatRoom = {
  id: number;
  roomName: string;
  roomType: string;
  updatedAt: Date;
};

export type ChatRoomMessage = {
  id: number;
  chatRoomId: number;
  user: User;
  userId: number;
  createdAt: Date;
  content: string;
};

export type ConnectionResult = {
  userId: number;
  displayName: string;
  visibleRooms: ChatRoom[];
  joiningRooms: ChatRoom[];
};

export type SayResult = ChatRoomMessage & {
  user: User;
};

export type JoinResult = {
  room: ChatRoom;
  user: User;
};

export type LeaveResult = {
  room: ChatRoom;
  user: User;
};

export type GetRoomMessagesResult = {
  id: number;
  messages: ChatRoomMessage[];
};

export type GetRoomMembersResult = {
  id: number;
  members: ChatUserRelation[];
};

export const Mapper = {
  user: (data: any): User => {
    return Utils.pick(data, 'id', 'displayName');
  },

  chatRoomMessage: (data: any): ChatRoomMessage => {
    const r: any = Utils.pick(
      data,
      'id',
      'chatRoomId',
      'user',
      'userId',
      'createdAt',
      'content'
    );
    if (r.user) {
      r.user = Mapper.user(r.user);
    }
    if (r.createdAt) {
      r.createdAt = new Date(r.createdAt);
    }
    return r;
  },
};

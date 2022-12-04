import * as Utils from '@/utils';

// 仮の型定義

export type User = {
  id: number;
  displayName: string;
  time?: Date;
  isEnabledAvatar: boolean;

  avatar?: boolean;
  avatarTime: number;
};

export const RoomTypesSelectable = ['PUBLIC', 'PRIVATE', 'LOCKED'] as const;
export const RoomTypes = [...RoomTypesSelectable, 'DM'] as const;
export type RoomType = typeof RoomTypes[number];

export type ChatRoom = {
  id: number;
  roomName: string;
  roomType: RoomType;
  ownerId: number;
  owner?: User;
  createdAt: Date;
  updatedAt: Date;
};

export type DmRoom = ChatRoom & {
  roomMember: ChatUserRelation[];
};

export type ChatUserRelation = {
  user: User;
  userId: number;
  chatRoomId: number;
  memberType: 'MEMBER' | 'ADMIN';
};

export type ChatUserRelationWithRoom = ChatUserRelation & {
  chatRoom: ChatRoom;
};

export type ChatRoomMessage = {
  id: number;
  chatRoomId: number;
  user: User;
  userId: number;
  createdAt: Date;
  content: string;
};

export type UserRelationMap = {
  [userId: number]: ChatUserRelation;
};

// コマンド系

export type SayArgument = string;
export type OpenArgument = Pick<ChatRoom, 'roomName' | 'roomType'>;

// リザルト系

export type ConnectionResult = {
  userId: number;
  displayName: string;
  visibleRooms: ChatRoom[];
  joiningRooms: ChatRoom[];
  dmRooms: DmRoom[];
  friends: User[];
  blockingUsers: User[];
};

export type HeartbeatResult = {
  userId: number;
  time: Date;
};

export type OfflineResult = {
  userId: number;
};

export type OpenResult = ChatRoom;

export type DmOpenResult = DmRoom;

export type SayResult = ChatRoomMessage & {
  user: User;
};

export type JoinResult = {
  relation: ChatUserRelationWithRoom;
  room: ChatRoom;
  user: User;
};

export type NomminateResult = {
  relation: ChatUserRelationWithRoom;
  room: ChatRoom;
  user: User;
};

export type LeaveResult = {
  relation: ChatUserRelationWithRoom;
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

export type FollowResult = {
  user: User;
};

export type UnfollowResult = {
  user: User;
};

export type BlockResult = {
  user: User;
};

export type UnblockResult = {
  user: User;
};

export type UserResult = {
  action: 'create' | 'update' | 'delete';
  id: number;
  data: Partial<User>;
};

export type ChatRoomResult = {
  id: number;
  action: 'update';
  data: Partial<ChatRoom>;
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

// UI系
export type MemberOperations = {
  onNomminateClick?: (r: ChatUserRelation) => void;
  onBanClick?: (r: ChatUserRelation) => void;
  onMuteClick?: (r: ChatUserRelation) => void;
  onKickClick?: (r: ChatUserRelation) => void;
};

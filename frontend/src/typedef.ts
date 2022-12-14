import * as Utils from '@/utils';

// 仮の型定義

export type User = {
  id: number;
  displayName: string;
  pulseTime?: Date;
  ongoingMatchId?: string;
  isEnabledAvatar: boolean;

  avatar?: boolean;
  avatarTime: number;
};

// TODO: inviteUI用の型、移動を検討
export type displayUser = Pick<
  User,
  'id' | 'displayName' | 'avatarTime' | 'isEnabledAvatar'
>;

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

export type ChatRoomJoinData = {
  chatRoom: ChatRoom;
  createdAt: Date;
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

const MessageTypes = [
  'OPENED',
  'UPDATED',
  'JOINED',
  'INVITED',
  'LEFT',
  'PR_OPEN',
  'PR_CANCEL',
  'NOMMINATED',
  'BANNED',
  'MUTED',
  'KICKED',
  'PR_START',
  'PR_RESULT',
  'PR_ERROR',
  'PR_STATUS',
] as const;
export type MessageType = typeof MessageTypes[number];

export type ChatRoomMessage = {
  id: number;
  chatRoomId: number;
  user: User;
  userId: number;
  secondaryUser?: User;
  secondaryUserId?: number;
  createdAt: Date;
  content: string;
  messageType?: MessageType;
  subpayload?: any;
  matchId?: string;
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
  joiningRooms: ChatRoomJoinData[];
  dmRooms: DmRoom[];
  friends: User[];
  blockingUsers: User[];
};

export type HeartbeatResult = {
  userId: number;
  pulseTime?: Date;
  ongoingMatchId?: string;
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

export type MessageUpdateResult = {
  roomId: number;
  messageId: number;
  message: ChatRoomMessage;
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
      'secondaryUser',
      'secondaryUserId',
      'createdAt',
      'content',
      'messageType',
      'subpayload',
      'matchId'
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

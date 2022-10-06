import * as Utils from '@/utils';

// 仮の型定義

export type User = {
  id: number;
  displayName: string;
};

export type ChatRoomMessage = {
  id: number;
  chatRoomId: number;
  user: User;
  userId: number;
  createdAt: Date;
  content: string;
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

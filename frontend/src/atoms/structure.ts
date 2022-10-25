import { atom } from 'jotai';
import * as TD from '../typedef';

export const structureAtom = {
  // 見えているチャットルームの一覧
  visibleRoomsAtom: atom<TD.ChatRoom[]>([]),
  // join しているチャットルームの一覧
  joiningRoomsAtom: atom<TD.ChatRoom[]>([]),
  // フレンドの一覧
  friends: atom<TD.User[]>([]),
  // 今フォーカスしているチャットルームのID
  focusedRoomIdAtom: atom<number>(-1),
  /**
   * チャットルーム内のメッセージのリスト
   */
  messagesInRoomAtom: atom<{
    [roomId: number]: TD.ChatRoomMessage[];
  }>({}),
  /**
   * チャットルーム内のメンバーのマップ
   */
  membersInRoomAtom: atom<{
    [roomId: number]: TD.UserRelationMap;
  }>({}),
};

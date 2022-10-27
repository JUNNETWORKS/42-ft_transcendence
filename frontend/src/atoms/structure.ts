import { atom } from 'jotai';
import * as TD from '../typedef';
import { storeAtoms } from './store';

// オブジェクトストラクチャー

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

export const dataAtom = {
  visibleRoomsAtom: atom((get) => get(structureAtom.visibleRoomsAtom)),
  joiningRoomsAtom: atom((get) => get(structureAtom.joiningRoomsAtom)),
  friends: atom((get) => {
    const us = get(storeAtoms.users);
    return get(structureAtom.friends).map((f) => us[f.id] || f);
  }),
  messagesInRoomAtom: atom((get) => get(structureAtom.messagesInRoomAtom)),
  membersInRoomAtom: atom((get) => get(structureAtom.membersInRoomAtom)),
};

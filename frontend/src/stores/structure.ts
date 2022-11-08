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

function filterBy<T extends { id: number }>(
  list: T[],
  map: { [K: number]: T }
): T[] {
  return list.map((f) => map[f.id] || f);
}

export const dataAtom = {
  visibleRoomsAtom: atom((get) =>
    filterBy(get(structureAtom.visibleRoomsAtom), get(storeAtoms.rooms))
  ),
  joiningRoomsAtom: atom((get) =>
    filterBy(get(structureAtom.joiningRoomsAtom), get(storeAtoms.rooms))
  ),
  friends: atom((get) =>
    filterBy(get(structureAtom.friends), get(storeAtoms.users))
  ),
  messagesInRoomAtom: atom((get) => get(structureAtom.messagesInRoomAtom)),
  membersInRoomAtom: atom((get) => get(structureAtom.membersInRoomAtom)),
};

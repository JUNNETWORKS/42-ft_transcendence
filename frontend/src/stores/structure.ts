import { atom, useAtom } from 'jotai';
import * as TD from '../typedef';
import * as Utils from '@/utils';
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

function transformBy<T extends { id: number }>(
  list: T[],
  map: { [K: number]: T }
): T[] {
  return list.map((f) => map[f.id] || f);
}

const derivedAtom = {
  visibleRoomsAtom: atom((get) =>
    transformBy(get(structureAtom.visibleRoomsAtom), get(storeAtoms.rooms))
  ),
  joiningRoomsAtom: atom((get) =>
    transformBy(get(structureAtom.joiningRoomsAtom), get(storeAtoms.rooms))
  ),
  friends: atom((get) =>
    transformBy(get(structureAtom.friends), get(storeAtoms.users))
  ),
  messagesInRoomAtom: atom((get) => get(structureAtom.messagesInRoomAtom)),
  membersInRoomAtom: atom((get) => get(structureAtom.membersInRoomAtom)),
};

export const dataAtom = {
  ...derivedAtom,
  useMembersInRoom(id: number) {
    const [dict] = useAtom(derivedAtom.membersInRoomAtom);
    const [users] = useAtom(storeAtoms.users);
    const members: TD.UserRelationMap = Utils.mapValues(
      dict[id] || {},
      (val, userId) => {
        const user = users[userId] || val.user;
        return {
          ...val,
          user,
        };
      }
    );
    return [members] as const;
  },
};

import { atom, useAtom } from 'jotai';
import { useCallback } from 'react';

import * as Utils from '@/utils';

import * as TD from '../typedef';
import { storeAtoms, useUpdateRoom } from './store';

// オブジェクトストラクチャー

export const structureAtom = {
  // 見えているチャットルームの一覧
  visibleRoomsAtom: atom<TD.ChatRoom[]>([]),
  // join しているチャットルームの一覧
  joiningRoomsAtom: atom<TD.ChatRoom[]>([]),
  // dmルームの一覧
  dmRoomsAtom: atom<TD.DmRoom[]>([]),
  // フレンドの一覧
  friends: atom<TD.User[]>([]),
  // ブロックしているユーザーの一覧
  blockingUsers: atom<TD.User[]>([]),
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
  dmRoomsAtom: atom((get) =>
    transformBy(get(structureAtom.dmRoomsAtom), get(storeAtoms.dmRooms))
  ),
  friends: atom((get) =>
    transformBy(get(structureAtom.friends), get(storeAtoms.users))
  ),
  blockingUsers: atom((get) =>
    transformBy(get(structureAtom.blockingUsers), get(storeAtoms.users))
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

export const useUpdateVisibleRooms = () => {
  const [rooms, setRooms] = useAtom(structureAtom.visibleRoomsAtom);
  const storeUpdater = useUpdateRoom();

  const addOne = (data: TD.ChatRoom) => {
    setRooms((prev) => {
      if (prev.find((r) => r.id === data.id)) {
        return prev;
      }
      const next = [...prev, data];
      return Utils.sortBy(
        Utils.sortBy(next, (r) => r.id, true),
        (r) => r.createdAt,
        true
      );
    });
    storeUpdater.addOne(data);
  };
  const addMany = (data: TD.ChatRoom[]) => {
    setRooms((prev) => {
      const next = [...prev];
      data.forEach((d) => {
        if (prev.find((r) => r.id === d.id)) {
          return;
        }
        next.push(d);
      });
      if (next.length === prev.length) {
        return prev;
      }
      return Utils.sortBy(
        Utils.sortBy(next, (r) => r.id, true),
        (r) => r.createdAt,
        true
      );
    });
    storeUpdater.addMany(data);
  };
  const updater = {
    visibleRooms: rooms,
    addOne,
    addMany,
  };
  return updater;
};

export const useUpdateJoiningRooms = () => {
  const [rooms, setRooms] = useAtom(structureAtom.joiningRoomsAtom);
  const storeUpdater = useUpdateRoom();

  const addOne = (data: TD.ChatRoom) => {
    setRooms((prev) => {
      if (prev.find((r) => r.id === data.id)) {
        return prev;
      }
      const next = [...prev, data];
      return Utils.sortBy(
        Utils.sortBy(next, (r) => r.id, true),
        (r) => r.createdAt,
        true
      );
    });
    storeUpdater.addOne(data);
  };
  const addMany = (data: TD.ChatRoom[]) => {
    setRooms((prev) => {
      const next = [...prev];
      data.forEach((d) => {
        if (prev.find((r) => r.id === d.id)) {
          return;
        }
        next.push(d);
      });
      if (next.length === prev.length) {
        return prev;
      }
      return Utils.sortBy(
        Utils.sortBy(next, (r) => r.id, true),
        (r) => r.createdAt,
        true
      );
    });
    storeUpdater.addMany(data);
  };
  const delOne = (data: TD.ChatRoom) => {
    setRooms((prev) => {
      if (!prev.find((r) => r.id === data.id)) {
        return prev;
      }
      return prev.filter((r) => r.id !== data.id);
    });
  };
  const updater = {
    visibleRooms: rooms,
    addOne,
    addMany,
    delOne,
  };
  return updater;
};

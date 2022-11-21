import { atom, useAtom } from 'jotai';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as TD from '../typedef';
import * as Utils from '../utils';

// オブジェクトストア

export const storeAtoms = {
  users: atom<{ [id: number]: TD.User }>({}),
  rooms: atom<{ [id: number]: TD.ChatRoom }>({}),
};

/**
 * usersストアを更新するための関数を提供するフック
 */
export const useUpdateUser = () => {
  const [usersStore, setUsersStore] = useAtom(storeAtoms.users);
  const updater = {
    addOne: useCallback(
      (data: TD.User) => {
        const d = Utils.datifyObject(data);
        setUsersStore((prev) => ({ [data.id]: d, ...prev }));
      },
      [setUsersStore]
    ),
    addMany: useCallback(
      (data: TD.User[]) => {
        const ds = data.map((d) => Utils.datifyObject(d, 'time'));
        setUsersStore((prev) => {
          const next = { ...prev };
          ds.forEach((d) => (next[d.id] = d));
          return next;
        });
      },
      [setUsersStore]
    ),
    updateOne: useCallback(
      (userId: number, part: Partial<TD.User>) => {
        const patched = Utils.datifyObject(part, 'time');
        if (part.avatar) {
          patched.avatarTime = Date.now();
        }
        setUsersStore((prev) => {
          const d = prev[userId];
          if (!d) {
            return prev;
          }
          const u = { ...d, ...patched };
          return { ...prev, [userId]: u };
        });
      },
      [setUsersStore]
    ),
    offlinate: useCallback(
      (userId: number) => {
        setUsersStore((prev) => {
          const d = prev[userId];
          if (!d) {
            return prev;
          }
          return {
            ...prev,
            [userId]: { ...Utils.omit(d, 'time') },
          };
        });
      },
      [setUsersStore]
    ),
    delOne: useCallback(
      (userId: number) => {
        setUsersStore((prev) => {
          const next: typeof prev = {};
          for (const id in prev) {
            if ((id as any) !== userId) {
              next[id] = prev[id];
            }
          }
          return next;
        });
      },
      [setUsersStore]
    ),
  };
  // delMany はいらんだろ

  return {
    usersStore,
    ...updater,
  };
};

export const useUserDataReadOnly = (id: number) => {
  const [usersStore] = useAtom(storeAtoms.users);
  return usersStore[id];
};

export const useUpdateRoom = () => {
  const [roomsStore, setRoomsStore] = useAtom(storeAtoms.rooms);
  const addOne = (data: TD.ChatRoom) => {
    setRoomsStore((prev) => ({ ...prev, [data.id]: data }));
  };
  const addMany = (data: TD.ChatRoom[]) => {
    setRoomsStore((prev) => {
      const next = { ...prev };
      data.forEach((d) => (next[d.id] = d));
      return next;
    });
  };
  const updateOne = (roomId: number, part: Partial<TD.ChatRoom>) => {
    const d = roomsStore[roomId];
    if (!d) {
      return;
    }
    setRoomsStore((prev) => ({ ...prev, [roomId]: { ...d, ...part } }));
  };
  return {
    roomsStore,
    addOne,
    addMany,
    updateOne,
  };
};

import { atom, useAtom } from 'jotai';
import { useCallback } from 'react';

import * as TD from '../typedef';
import * as Utils from '../utils';
import { authAtom } from './auth';

// オブジェクトストア

export const storeAtoms = {
  users: atom<{ [id: number]: TD.User }>({}),
  rooms: atom<{ [id: number]: TD.ChatRoom }>({}),
  dmRooms: atom<{ [id: number]: TD.DmRoom }>({}),
};

/**
 * usersストアを更新するための関数を提供するフック
 */
export const useUpdateUser = () => {
  const [usersStore, setUsersStore] = useAtom(storeAtoms.users);
  const [personalData, setPersonalData] = useAtom(authAtom.personalData);

  const updater = {
    addOne: useCallback(
      (data: TD.User) => {
        const d = Utils.datifyObject(data);
        if (d.avatar) {
          d.isEnabledAvatar = true;
        }
        d.avatarTime = Date.now();
        setUsersStore((prev) => ({ [data.id]: d, ...prev }));
      },
      [setUsersStore]
    ),
    addMany: useCallback(
      (data: TD.User[]) => {
        const ds = data.map((u) => {
          const d = Utils.datifyObject(u, 'time');
          if (d.avatar) {
            d.isEnabledAvatar = true;
          }
          d.avatarTime = Date.now();
          return d;
        });
        setUsersStore((prev) => {
          const next = { ...prev };
          ds.forEach((d) => {
            if (next[d.id]) {
              next[d.id] = { ...next[d.id], ...d };
            } else {
              next[d.id] = d;
            }
          });
          return next;
        });
      },
      [setUsersStore]
    ),
    updateOne: useCallback(
      (userId: number, part: Partial<TD.User>) => {
        const patched = Utils.datifyObject(part, 'time');
        if (part.avatar || part.isEnabledAvatar) {
          patched.isEnabledAvatar = true;
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
        if (personalData?.id === userId) {
          // 自分のデータの更新を受け取った場合は`personalData`の更新も同時に行う
          if (personalData) {
            setPersonalData({ ...personalData, ...patched });
          }
        }
      },
      [setUsersStore, setPersonalData, personalData?.id]
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

export const useRoomDataReadOnly = (id: number) => {
  const [store] = useAtom(storeAtoms.rooms);
  return store[id];
};

export const useDmRoomDataReadOnly = (id: number) => {
  const [store] = useAtom(storeAtoms.dmRooms);
  return store[id];
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

export const useUpdateDmRoom = () => {
  const [dmRoomsStore, setDmRoomsStore] = useAtom(storeAtoms.dmRooms);
  const addOne = (data: TD.DmRoom) => {
    setDmRoomsStore((prev) => ({ ...prev, [data.id]: data }));
  };
  const addMany = (data: TD.DmRoom[]) => {
    setDmRoomsStore((prev) => {
      const next = { ...prev };
      data.forEach((d) => (next[d.id] = d));
      return next;
    });
  };
  const updateOne = (roomId: number, part: Partial<TD.DmRoom>) => {
    const d = dmRoomsStore[roomId];
    if (!d) {
      return;
    }
    setDmRoomsStore((prev) => ({ ...prev, [roomId]: { ...d, ...part } }));
  };
  return {
    dmRoomsStore,
    addOne,
    addMany,
    updateOne,
  };
};

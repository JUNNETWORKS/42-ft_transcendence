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
        setUsersStore((prev) => {
          const d = prev[userId];
          if (!d) {
            return prev;
          }
          const p = Utils.datifyObject(part, 'time');
          return { ...prev, [userId]: { ...d, ...p } };
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

type FetchState = 'Neutral' | 'Fetching' | 'Fetched' | 'Failed';
/**
 * セットしたIDのユーザ情報を(なければ取得して)表示するためのカスタムフック
 * @param id
 */
export const useUserData = (userId: number) => {
  const [state, setState] = useState<FetchState>('Neutral');
  const { usersStore, addOne } = useUpdateUser();
  const userData = useUserDataReadOnly(userId);
  const fetchUrl = useRef('');
  useEffect(() => {
    // もうこのユーザのデータがあるなら終了
    const url = `http://localhost:3000/users/${userId}`;
    if (userData && userData.id === userId) {
      setState('Fetched');
      return;
    }
    // もうこのユーザのfetchが走っているなら終了
    if (fetchUrl.current === url) {
      return;
    }
    // 念の為データを破棄し, stateを変えてfetch開始
    fetchUrl.current = url;
    if (usersStore[userId]) {
      setState('Fetched');
      return;
    }
    setState('Fetching');
    (async () => {
      try {
        const result = await fetch(fetchUrl.current, {
          method: 'GET',
          mode: 'cors',
        });
        if (result.ok) {
          const user = await result.json();
          // fetch中にユーザIDが切り替わっていた場合は結果を捨てる
          if (fetchUrl.current === url) {
            addOne(user);
            setState('Fetched');
          }
          return;
        }
      } catch (e) {
        console.error(e);
      }
      setState('Failed');
    })();
  }, [userId, userData, usersStore, addOne]);
  return [state, userData] as const;
};

export const useUserDataReadOnly = (id: number) => {
  const [usersStore] = useAtom(storeAtoms.users);
  return usersStore[id];
};

export const useUpdateRoom = () => {
  const [roomStore, setRoomsStore] = useAtom(storeAtoms.rooms);
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
    const d = roomStore[roomId];
    if (!d) {
      return;
    }
    setRoomsStore((prev) => ({ ...prev, [roomId]: { ...d, ...part } }));
  };
  return {
    addOne,
    addMany,
    updateOne,
  };
};

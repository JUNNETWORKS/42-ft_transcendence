import { atom, useAtom } from 'jotai';
import { useEffect, useMemo, useState } from 'react';
import * as TD from './typedef';

// オブジェクトストア

export const objectStoreAtoms = {
  users: atom<{ [id: number]: TD.User }>({}),
  rooms: atom<{ [id: number]: TD.ChatRoom }>({}),
};

/**
 * usersストアを更新するための関数を提供するフック
 */
export const useUpdateUser = () => {
  const [usersStore, setUsersStore] = useAtom(objectStoreAtoms.users);

  const addOne = (data: TD.User) => {
    setUsersStore((prev) => ({ ...prev, [data.id]: data }));
  };
  const addMany = (data: TD.User[]) => {
    setUsersStore((prev) => {
      const next = { ...prev };
      data.forEach((d) => (next[d.id] = d));
      return next;
    });
  };
  const delOne = (userId: number) => {
    setUsersStore((prev) => {
      const next: typeof prev = {};
      for (const id in prev) {
        if ((id as any) !== userId) {
          next[id] = prev[id];
        }
      }
      return next;
    });
  };
  // delMany はいらんだろ

  return {
    usersStore,
    addOne,
    addMany,
    delOne,
  };
};

type FetchState = 'Neutral' | 'Fetching' | 'Fetched' | 'Failed';
/**
 * セットしたIDのユーザ情報を(なければ取得して)表示するためのカスタムフック
 * @param id
 */
export const useUserData = (id: number) => {
  const [userId, setUserId] = useState(id);
  const [state, setState] = useState<FetchState>('Neutral');
  const [usersStore, setUsersStore] = useAtom(objectStoreAtoms.users);
  const userData = useMemo(
    () => usersStore[userId] || null,
    [usersStore, userId]
  );

  useEffect(() => {
    if (userData) {
      setState('Fetched');
    } else {
      if (state === 'Fetching') {
        // failed?
        setState('Failed');
      } else {
        setState('Neutral');
      }
    }
  }, [userId]);

  useEffect(() => {
    if (!(userId > 0)) {
      return;
    }
    switch (state) {
      case 'Neutral':
        if (userData) {
          setState('Fetched');
        } else {
          setState('Fetching');
        }
        break;
      case 'Fetching':
        (async () => {
          try {
            // TODO: WSでやる
            const result = await fetch(
              `http://localhost:3000/users/${userId}`,
              {
                method: 'GET',
                mode: 'cors',
              }
            );
            if (result.ok) {
              const user = await result.json();
              setUsersStore({ ...usersStore, [user.id]: user });
              if (userId === user.id) {
                setState('Fetched');
              } else {
                setState('Neutral');
              }
              return;
            }
          } catch (e) {
            console.error(e);
          }
          setState('Failed');
        })();
        break;
    }
  }, [state]);
  return [userData, state, setUserId] as const;
};

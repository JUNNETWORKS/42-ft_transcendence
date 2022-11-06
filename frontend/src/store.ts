import { atom, useAtom } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import * as TD from './typedef';
import * as Utils from './utils';

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
    const d = Utils.datifyObject(data);
    setUsersStore((prev) => ({ [data.id]: d, ...prev }));
  };
  const addMany = (data: TD.User[]) => {
    const ds = data.map((d) => Utils.datifyObject(d, 'time'));
    setUsersStore((prev) => {
      const next = { ...prev };
      ds.forEach((d) => (next[d.id] = d));
      return next;
    });
  };
  const updateOne = (userId: number, part: Partial<TD.User>) => {
    const d = usersStore[userId];
    if (!d) {
      return;
    }
    const p = Utils.datifyObject(part, 'time');
    setUsersStore((prev) => ({ ...prev, [userId]: { ...d, ...p } }));
  };
  const offlinate = (userId: number) => {
    const d = usersStore[userId];
    if (!d) {
      return;
    }
    setUsersStore((prev) => ({
      ...prev,
      [userId]: { ...Utils.omit(d, 'time') },
    }));
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
    updateOne,
    delOne,
    offlinate,
  };
};

type FetchState = 'Neutral' | 'Fetching' | 'Fetched' | 'Failed';
/**
 * セットしたIDのユーザ情報を(なければ取得して)表示するためのカスタムフック
 * @param id
 */
export const useUserData = (userId: number) => {
  const [state, setState] = useState<FetchState>('Neutral');
  const [usersStore] = useAtom(objectStoreAtoms.users);
  const [personalData, setPersonalData] = useState<TD.User | null>(
    usersStore[userId] || null
  );
  const fetchUrl = useRef('');
  useEffect(() => {
    // もうこのユーザのデータがあるなら終了
    const url = `http://localhost:3000/users/${userId}`;
    if (personalData && personalData.id === userId) {
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
      setPersonalData(usersStore[userId]);
      setState('Fetched');
      return;
    }
    setPersonalData(null);
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
            setPersonalData(user);
            setState('Fetched');
          }
          return;
        }
      } catch (e) {
        console.error(e);
      }
      setState('Failed');
    })();
  }, [userId, personalData, usersStore]);
  return [state, personalData] as const;
};

export const useUserDataReadOnly = (id: number) => {
  const [usersStore] = useAtom(objectStoreAtoms.users);
  return usersStore[id];
};

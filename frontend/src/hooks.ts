import { useEffect, useState, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { UserPersonalData } from './types';

/**
 * 通常の`useState`の返り値に加えて, stateを初期値に戻す関数`resetter`を返す.
 * @param initial
 * @returns
 */
export function useStateWithResetter<T>(initial: T) {
  const [val, setter] = useState<T>(initial);
  const resetter = () => setter(initial);
  return [val, setter, resetter] as const;
}

export const useQuery = () => {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
};

/**
 * 一度だけ発動する`useEffect`
 * @param action
 */
export const useEffectOnce = (action: React.EffectCallback) => {
  useEffect(action, []);
};

export type AppCredential = {
  token: string;
};

/**
 * `localStorage`**など**に保存されているクレデンシャル情報を取得・更新するフック。
 * @returns
 */
export const useStoredCredential = () => {
  // TODO: 定数なのでどっかで一元管理
  const credentialKey = 'ft_transcendence_credential';
  const [storedStr, setStoredStr] = useState(
    localStorage.getItem(credentialKey) || ''
  );

  const getter = useMemo((): AppCredential | null => {
    try {
      const credential = JSON.parse(storedStr);
      if (credential && typeof credential === 'object') {
        const token = credential.token;
        if (typeof token === 'string') {
          return { token };
        }
      }
    } catch (e) {
      //
    }
    return null;
  }, [storedStr]);

  const setter = (val: AppCredential | null) => {
    setStoredStr((prev) => {
      if (!val) {
        // 削除
        localStorage.removeItem(credentialKey);
        return '';
      }
      const str = JSON.stringify(val);
      if (str === prev) {
        return prev;
      }
      localStorage.setItem(credentialKey, str);
      return str;
    });
  };
  return [getter, setter] as const;
};

type FetchState = 'Neutral' | 'Fetching' | 'Fetched' | 'Failed';
export const usePersonalData = (userId: number) => {
  const [state, setState] = useState<FetchState>('Neutral');
  const [personalData, setPersonalData] = useState<UserPersonalData | null>(
    null
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
  }, [userId, personalData]);
  return [state, personalData] as const;
};

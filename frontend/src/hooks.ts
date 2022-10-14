import { useEffect, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

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

/**
 * `id`の変化をトリガーとして何らかのアクションを行うフック
 * @param initialId `id`の初期値
 * @param action  `id`を受け取り, アクションを実行する関数
 */
export function useAction<T>(initialId: T, action: (id: T) => void) {
  const [actionId, setActionId] = useState<T>(initialId);
  useEffect(() => action(actionId), [action, actionId]);
  return [setActionId];
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

type AppCredential = {
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

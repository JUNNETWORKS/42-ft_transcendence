import { useEffect, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

export type AppCredential = {
  token: string;
};

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

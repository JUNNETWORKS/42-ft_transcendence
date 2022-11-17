import { useEffect, useState, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import * as TD from '@/typedef';

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
 * Fetchフック
 * @param fetcher fetch(実は`Promise<Response>`ならなんでも良い)を返す関数
 * @param onFetched 成功時に`Response`を受け取る関数
 * @param onFailed 失敗時にエラー(`unknown`)を受け取る関数
 * @returns
 */
export const useFetch = (
  fetcher: () => Promise<Response>,
  onFetched: (res: Response) => void,
  onFailed?: (error: unknown) => void
) => {
  type FetchState = 'Neutral' | 'Fetching' | 'Fetched' | 'Failed';
  const [state, setState] = useState<FetchState>('Neutral');
  useEffect(() => {
    if (state !== 'Fetching') {
      return;
    }
    const doFetch = async () => {
      try {
        const result = await fetcher();
        if (result.ok) {
          setState('Fetched');
          onFetched(result);
        }
      } catch (e) {
        console.error(e);
        setState('Failed');
        if (onFailed) {
          onFailed(e);
        }
      }
    };
    try {
      doFetch();
    } catch (e) {
      console.error(e);
      setState('Failed');
      if (onFailed) {
        onFailed(e);
      }
    }
  }, [state]);
  const submit = () => setState('Fetching');
  const neutralize = () => {
    if (state !== 'Fetching') {
      setState('Neutral');
    }
  };

  return [
    /**
     * 内部状態
     */
    state,
    /**
     * 実行すると, 次の副作用タイミングで fetch 処理をキックする
     */
    submit,
    neutralize,
  ] as const;
};

/**
 * API呼び出しフック(useFetchをラップしたもの)
 */
export const useAPI = (
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  option: {
    payload?: () => any;
    onFetched: (json: unknown) => void;
    onFailed?: (error: unknown) => void;
  }
) => {
  const { payload, onFetched, onFailed } = option;

  return useFetch(
    () =>
      fetch(`http://localhost:3000${endpoint}`, {
        method,
        mode: 'cors',
        ...(payload
          ? {
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(payload()),
            }
          : {}),
      }),
    (res) =>
      (async () => {
        try {
          const json = await res.json();
          onFetched(json);
        } catch (e) {
          console.error(e);
          if (onFailed) {
            onFailed(e);
          }
        }
      })(),
    onFailed
  );
};

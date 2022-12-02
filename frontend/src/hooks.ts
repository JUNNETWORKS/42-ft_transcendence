import { useAtom } from 'jotai';
import { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

import { storedCredentialAtom } from '@/stores/auth';

import { APIError } from './errors/APIError';

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
export function useFetch<T>(
  fetcher: (arg?: T) => Promise<Response>,
  onFetched: (res: Response) => void,
  onFailed?: (error: unknown) => void
) {
  type FetchState = 'Neutral' | 'Fetching' | 'Fetched' | 'Failed';
  const [state, setState] = useState<FetchState>('Neutral');
  const submit = async (arg?: T) => {
    if (state === 'Fetching') {
      return;
    }
    setState('Fetching');
    try {
      const result = await fetcher(arg);
      if (!result.ok) {
        throw new APIError(result.statusText, result);
      }
      setState('Fetched');
      onFetched(result);
    } catch (e) {
      setState('Failed');
      if (onFailed) {
        onFailed(e);
      }
    }
  };
  const neutralize = () => {
    if (state !== 'Fetching') {
      setState('Neutral');
    }
  };
  const submitNothing = () => submit();

  return [
    /**
     * 内部状態
     */
    state,
    /**
     * 実行すると, 次の副作用タイミングで fetch 処理をキックする
     */
    submitNothing,
    neutralize,
    submit,
  ] as const;
}

/**
 * API呼び出しフック(useFetchをラップしたもの)
 */
export const useAPI = (
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  endpoint: string,
  option: {
    credential?: { token: string };
    payload?: () => any;
    onFailed?: (error: unknown) => void;
  } & ({ onFetched: (json: unknown) => void } | { onFinished: () => void })
) => {
  const { payload, onFailed } = option;
  const [credential] = useAtom(storedCredentialAtom);
  return useFetch(
    (
      args: {
        payload?: any;
      } = {}
    ) => {
      const headers: HeadersInit = {};
      if (payload) {
        headers['Content-Type'] = 'application/json';
      }
      const payloadObject = args.payload || (payload ? payload() : null);
      const payloadPart = payloadObject
        ? { body: JSON.stringify(payloadObject) }
        : {};
      const usedCredential = option.credential || credential;
      if (usedCredential) {
        headers['Authorization'] = `Bearer ${usedCredential.token}`;
      }
      return fetch(`http://localhost:3000${endpoint}`, {
        method,
        headers,
        mode: 'cors',
        ...payloadPart,
      });
    },
    (res) =>
      (async () => {
        try {
          if ('onFetched' in option) {
            const json = await res.json();
            option.onFetched(json);
            return;
          }
          option.onFinished();
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

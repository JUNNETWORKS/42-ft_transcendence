import { useAtom } from 'jotai';
import { useCallback } from 'react';

import { storedCredentialAtom } from '@/stores/auth';

export const useAPICallerWithCredential = () => {
  const [credential] = useAtom(storedCredentialAtom);

  const callApiWithCredential = useCallback(
    (
      method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
      endpoint: string,
      option: {
        credential?: any;
        payloadFunc?: () => any;
        payload?: any;
      } = {}
    ) => callAPI(method, endpoint, { ...option, credential }),
    [credential]
  );

  return callApiWithCredential;
};

export async function callAPI(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  endpoint: string,
  option: {
    credential?: any;
    payloadFunc?: () => any;
    payload?: any;
  } = {}
) {
  const headers: HeadersInit = {};
  if (option.payloadFunc) {
    headers['Content-Type'] = 'application/json';
  }
  const payloadObject =
    option.payload || (option.payloadFunc ? option.payloadFunc() : null);
  const payloadPart = payloadObject
    ? { body: JSON.stringify(payloadObject) }
    : {};
  const usedCredential = option.credential;
  if (usedCredential) {
    headers['Authorization'] = `Bearer ${usedCredential.token}`;
  }
  return fetch(`http://localhost:3000${endpoint}`, {
    method,
    headers,
    mode: 'cors',
    ...payloadPart,
  });
}

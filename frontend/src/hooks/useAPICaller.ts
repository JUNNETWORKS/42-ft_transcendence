import { useAtom } from 'jotai';

import { storedCredentialAtom } from '@/stores/auth';

export function useAPICallerWithCredential() {
  const [credential] = useAtom(storedCredentialAtom);
  return function (
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    endpoint: string,
    option: {
      credential?: any;
      payloadFunc?: () => any;
      payload?: any;
    } = {}
  ) {
    return callAPI(method, endpoint, { ...option, credential });
  };
}

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

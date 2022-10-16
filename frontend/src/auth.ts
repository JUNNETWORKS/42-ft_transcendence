import { AppCredential } from './hooks';

const apiHost = `http://localhost:3000`;

export type AuthenticationFlowState =
  | 'Neutral'
  | 'Validating'
  | 'Authenticated'
  | 'NotAuthenticated';

export type FtAuthenticationFlowState =
  | 'Neutral'
  | 'NeutralAuthorizationCode'
  | 'ValidatingAuthorizationCode';

export const urlLoginFt = `${apiHost}/auth/login_ft`;

export const callSession = async (
  credential: AppCredential | null,
  onSucceeded: (user: any) => void,
  onFailed: () => void
) => {
  console.log({ credential });
  if (credential && credential.token) {
    console.log(`calling cs`);
    try {
      const result = await fetch(`${apiHost}/auth/session`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          Authorization: `Bearer ${credential.token}`,
        },
      });
      const json = await result.json();
      console.log('cs', json);
      if (json) {
        onSucceeded(json);
        return;
      }
    } catch (e) {
      console.error(e);
    }
  }
  onFailed();
};

export const callCallbackFt = async (
  authCode: string,
  onSucceeded: (token: string, user: any) => void,
  onFailed: () => void
) => {
  const url = `${apiHost}/auth/callback_ft?code=${authCode}`;
  console.log(`calling cf`, url);
  const result = await fetch(url, {
    method: 'GET',
    mode: 'cors',
    headers: {},
  });
  if (result.ok) {
    const { access_token, user } = (await result.json()) || {};
    if (access_token && typeof access_token === 'string') {
      // アクセストークンが得られた
      // -> 認証完了状態にする
      onSucceeded(access_token, user);
      return;
    }
  }
  // アクセストークンがなかった
  // クレデンシャルを破棄する
  onFailed();
};

export const callSelf = async (
  userId: string,
  onSucceeded: (token: string, user: any) => void,
  onFailed: () => void
) => {
  const url = `${apiHost}/auth/self/${userId}`;
  const result = await fetch(url, {
    method: 'GET',
    mode: 'cors',
  });
  if (result.ok) {
    const json = await result.json();
    console.log('json', json);
    const { access_token: token, user } = json;
    onSucceeded(token, user);
    return;
  }
  onFailed();
};

import { AppCredential } from '@/stores/auth';

/**
 * バックエンドサーバのドメイン
 */
const backendHost = `http://localhost:3000`;

/**
 * (全体)認証フロー状態
 */
export type AuthenticationFlowState =
  | 'Neutral'
  | 'Validating'
  | 'Authenticated'
  | 'NotAuthenticated';

/**
 * 42認証フロー状態
 */
export type FtAuthenticationFlowState =
  | 'Neutral'
  | 'NeutralAuthorizationCode'
  | 'ValidatingAuthorizationCode';

/**
 * チャットWSのURL
 */
export const urlChatSocket = `${backendHost}/chat`;

/**
 * 42認証入口のURL
 */
export const urlLoginFt = `${backendHost}/auth/login_ft`;

/**
 * クレデンシャルデータを検証し, ユーザ情報に変換する.
 * @param credential
 * @param onSucceeded 変換成功時の処理
 * @param onFailed 変換失敗時の処理
 * @returns
 */
export const verifyCredential = async (
  credential: AppCredential | null,
  onSucceeded: (user: any) => void,
  onFailed: () => void
) => {
  if (credential && credential.token) {
    try {
      const result = await fetch(`${backendHost}/auth/session`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          Authorization: `Bearer ${credential.token}`,
        },
      });
      const json = await result.json();
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

/**
 * OAuth2の認可コードを検証し, アクセストークン(とユーザ情報)に変換する
 * @param authCode
 * @param onSucceeded 変換成功時の処理
 * @param onFailed 変換失敗時の処理
 * @returns
 */
export const verifyOAuth2AuthorizationCode = async (
  authCode: string,
  onSucceeded: (token: string, user: any) => void,
  onFailed: () => void
) => {
  const url = `${backendHost}/auth/callback_ft?code=${authCode}`;
  const result = await fetch(url, {
    method: 'GET',
    mode: 'cors',
    headers: {},
  });
  if (result.ok) {
    const { access_token, user } = (await result.json()) || {};
    if (access_token && typeof access_token === 'string') {
      onSucceeded(access_token, user);
      return;
    }
  }
  onFailed();
};

/**
 * ユーザIDをアクセストークン(とユーザ情報)に変換する
 * TODO: リリース時には無効化すること!!!
 * @param userId
 * @param onSucceeded 変換成功時の処理
 * @param onFailed 変換失敗時の処理
 * @returns
 */
export const loginBySelf = async (
  userId: string,
  onSucceeded: (token: string, user: any) => void,
  onFailed: () => void
) => {
  const url = `${backendHost}/auth/self/${userId}`;
  const result = await fetch(url, {
    method: 'GET',
    mode: 'cors',
  });
  if (result.ok) {
    const json = await result.json();
    const { access_token: token, user } = json;
    onSucceeded(token, user);
    return;
  }
  onFailed();
};

export const loginByPassword = async (
  email: string,
  password: string,
  onSucceeded: (token: string, user: any) => void,
  onFailed: () => void
) => {
  const url = `${backendHost}/auth/login`;
  const result = await fetch(url, {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });
  if (result.ok) {
    const json = await result.json();
    const { access_token: token, user } = json;
    onSucceeded(token, user);
    return;
  }
  onFailed();
};

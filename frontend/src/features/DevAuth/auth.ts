import { Constants } from '@/constants';
import { APIError } from '@/errors/APIError';
import { AppCredential } from '@/stores/auth';

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
export const urlChatSocket = `${Constants.backendHost}/chat`;

/**
 * 42認証入口のURL
 */
export const urlLoginFt = `${Constants.backendHost}/auth/login_ft`;

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
  onFailed: (e?: any) => void
) => {
  if (credential && credential.token) {
    try {
      const result = await fetch(`${Constants.backendHost}/auth/session`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          Authorization: `Bearer ${credential.token}`,
        },
      });
      if (result.ok) {
        const json = await result.json();
        if (json) {
          onSucceeded(json);
          return;
        }
      }
      throw new APIError(result.statusText, result);
    } catch (e) {
      console.error(e);
      onFailed(e);
      return;
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
  onSucceeded: (token: string, user: any, required2fa: boolean) => void,
  onFailed: () => void
) => {
  const url = `${Constants.backendHost}/auth/callback_ft?code=${authCode}`;
  const result = await fetch(url, {
    method: 'GET',
    mode: 'cors',
    headers: {},
  });
  if (result.ok) {
    const { access_token, user, required2fa } = (await result.json()) || {};
    if (access_token && typeof access_token === 'string') {
      onSucceeded(access_token, user, required2fa);
      return;
    }
  }
  onFailed();
};

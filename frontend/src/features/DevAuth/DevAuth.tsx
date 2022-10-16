import { personalDataAtom, storedCredentialAtom } from '@/atoms';
import { AppCredential, useQuery } from '@/hooks';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecoilState } from 'recoil';
import {
  DevAuthenticated,
  DevAuthLogin,
  DevAuthValidating,
  UserPersonalData,
} from './AuthCard';

const apiHost = `http://localhost:3000`;

type AuthenticationFlowState =
  | 'Neutral'
  | 'Validating'
  | 'Authenticated'
  | 'NotAuthenticated'
  | 'NeutralAuthorizationCode'
  | 'ValidatingAuthorizationCode';

export const DevAuth = () => {
  const [storedCredential, setStoredCredential] =
    useRecoilState(storedCredentialAtom);
  // パーソナルデータ
  const [personalData, setPersonalData] = useRecoilState(personalDataAtom);
  const query = useQuery();
  const navigation = useNavigate();
  // 認証フローの状態
  const [initialAuthCode, initialFlowState] = (() => {
    const code = query.get('code');
    if (!code || typeof code !== 'string') {
      return ['', 'Neutral'] as const;
    }
    // 認可コードがある -> 認可コードを検証!!
    return [code, 'NeutralAuthorizationCode'] as const;
  })();
  const [authState, setAuthState] =
    useState<AuthenticationFlowState>(initialFlowState);
  // 認可コード
  const [ftAuthCode] = useState(initialAuthCode);

  const callSession = async (
    onSucceeded: (user: any) => void,
    onFailed: () => void
  ) => {
    console.log({ storedCredential });
    if (storedCredential && storedCredential.token) {
      console.log(`calling callSession`);
      try {
        const result = await fetch(`${apiHost}/auth/session`, {
          method: 'GET',
          mode: 'cors',
          headers: {
            Authorization: `Bearer ${storedCredential.token}`,
          },
        });
        const json = await result.json();
        console.log('callSession', json);
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

  const doLogout = () => {
    setStoredCredential(null);
    setPersonalData(null);
    setAuthState('NotAuthenticated');
  };

  const finalizer = (token: string, user: any) => {
    setStoredCredential({ token });
    setPersonalData(user);
    setAuthState('Authenticated');
  };

  const invokeSession = () =>
    callSession(
      (user) => {
        setPersonalData(user);
        setAuthState('Authenticated');
      },
      () => {
        setPersonalData(null);
        setAuthState('NotAuthenticated');
      }
    );
  const invokeCallbackFt = () => callCallbackFt(finalizer, doLogout);

  const callCallbackFt = async (
    onSucceeded: (token: string, user: any) => void,
    onFailed: () => void
  ) => {
    const url = `${apiHost}/auth/callback_ft?code=${ftAuthCode}`;
    console.log(`calling callCallbackFt`, url);
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

  // 認証状態のチェック
  useEffect(() => {
    switch (authState) {
      case 'Neutral': {
        // [検証中]
        // -> 保存されてる
        setAuthState('Validating');
        break;
      }
      case 'Validating':
        invokeSession();
        break;
      case 'NotAuthenticated':
        // [未認証]
        // -> ログインUIを表示
        break;
      case 'NeutralAuthorizationCode': {
        // [認可コード検証]
        // -> 認可コード検証APIをコール
        if (!ftAuthCode || typeof ftAuthCode !== 'string') {
          break;
        }
        navigation('/auth', { replace: true });
        setAuthState('ValidatingAuthorizationCode');
        break;
      }
      case 'ValidatingAuthorizationCode': {
        invokeCallbackFt();
        break;
      }
    }
  }, [authState]);

  const presentator = (() => {
    switch (authState) {
      case 'Neutral':
      case 'Validating':
        return DevAuthValidating();
      case 'Authenticated':
        return DevAuthenticated({
          personalData: personalData!,
          onLogout: doLogout,
        });
      case 'NotAuthenticated':
        return DevAuthLogin({ finalizer });
      case 'NeutralAuthorizationCode':
      case 'ValidatingAuthorizationCode':
        return DevAuthValidating();
      default:
        return <div>(default)</div>;
    }
  })();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-32 ">
      <div className="basis-1 border-4 border-white" style={{ width: '28rem' }}>
        {presentator}
      </div>
    </div>
  );
};

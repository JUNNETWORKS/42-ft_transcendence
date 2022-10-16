import {
  authFlowStateAtom,
  personalDataAtom,
  storedCredentialAtom,
} from '@/atoms';
import { useQuery } from '@/hooks';
import { useAtom } from 'jotai';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DevAuthenticated, DevAuthLogin, DevAuthValidating } from './AuthCard';

const apiHost = `http://localhost:3000`;

type FtAuthenticationFlowState =
  | 'Neutral'
  | 'NeutralAuthorizationCode'
  | 'ValidatingAuthorizationCode';

const callCallbackFt = async (
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

export const DevAuth = () => {
  const [authState, setAuthState] = useAtom(authFlowStateAtom);
  const setStoredCredential = useAtom(storedCredentialAtom)[1];
  const setPersonalData = useAtom(personalDataAtom)[1];

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
  const [ftAuthState, setFtAuthState] =
    useState<FtAuthenticationFlowState>(initialFlowState);
  // 認可コード
  const [ftAuthCode] = useState(initialAuthCode);

  const doLogout = () => {
    setStoredCredential(null);
    setPersonalData(null);
    setAuthState('NotAuthenticated');
    setFtAuthState('Neutral');
  };

  const finalizer = (token: string, user: any) => {
    setStoredCredential({ token });
    setPersonalData(user);
    setFtAuthState('Neutral');
    setAuthState('Authenticated');
  };
  const invokeCallbackFt = (authCode: string) =>
    callCallbackFt(authCode, finalizer, doLogout);

  // 認証状態のチェック
  useEffect(() => {
    switch (ftAuthState) {
      case 'Neutral': {
        break;
      }
      case 'NeutralAuthorizationCode': {
        // [認可コード検証]
        // -> 認可コード検証APIをコール
        if (!ftAuthCode || typeof ftAuthCode !== 'string') {
          break;
        }
        navigation('/auth', { replace: true });
        setFtAuthState('ValidatingAuthorizationCode');
        break;
      }
      case 'ValidatingAuthorizationCode': {
        invokeCallbackFt(ftAuthCode);
        break;
      }
    }
  }, [ftAuthState]);

  const presentator = (() => {
    switch (ftAuthState) {
      case 'NeutralAuthorizationCode':
      case 'ValidatingAuthorizationCode':
        return <DevAuthValidating />;
      default:
        switch (authState) {
          case 'Neutral':
          case 'Validating':
            return <DevAuthValidating />;
          case 'Authenticated':
            return <DevAuthenticated onLogout={doLogout} />;
          case 'NotAuthenticated':
            return <DevAuthLogin finalizer={finalizer} />;
          default:
            return <div>(default)</div>;
        }
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

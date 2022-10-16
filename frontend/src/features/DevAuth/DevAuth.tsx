import {
  authFlowStateAtom,
  personalDataAtom,
  storedCredentialAtom,
} from '@/atoms';
import { callCallbackFt, FtAuthenticationFlowState } from '@/auth';
import { useQuery } from '@/hooks';
import { useAtom } from 'jotai';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DevAuthenticated, DevAuthLogin, DevAuthValidating } from './AuthCard';

export const DevAuth = () => {
  const [authState, setAuthState] = useAtom(authFlowStateAtom);
  const setStoredCredential = useAtom(storedCredentialAtom)[1];
  const setPersonalData = useAtom(personalDataAtom)[1];

  const query = useQuery();
  const navigation = useNavigate();

  const [initialAuthCode, initialFlowState] = (() => {
    const code = query.get('code');
    if (!code || typeof code !== 'string') {
      return ['', 'Neutral'] as const;
    }
    // 認可コードがある -> 認可コードを検証!!
    return [code, 'NeutralAuthorizationCode'] as const;
  })();
  // 42認証用の認証フロー状態
  const [ftAuthState, setFtAuthState] =
    useState<FtAuthenticationFlowState>(initialFlowState);
  // 認可コード
  const [ftAuthCode] = useState(initialAuthCode);

  const anonymizer = () => {
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

  // 認証状態のチェック
  useEffect(() => {
    switch (ftAuthState) {
      case 'Neutral': {
        break;
      }
      case 'NeutralAuthorizationCode': {
        // -> URLに認可コードがあるなら, それを取り込んで ValidatingAuthorizationCode に遷移
        if (!ftAuthCode || typeof ftAuthCode !== 'string') {
          setFtAuthState('Neutral');
          break;
        }
        navigation('/auth', { replace: true });
        // ここ(useEffect内)でのstate変更は意図的なもの
        setFtAuthState('ValidatingAuthorizationCode');
        break;
      }
      case 'ValidatingAuthorizationCode': {
        // -> 認可コード検証APIをコール
        callCallbackFt(ftAuthCode, finalizer, anonymizer);
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
            return <DevAuthenticated onLogout={anonymizer} />;
          case 'NotAuthenticated':
            return (
              <DevAuthLogin onSucceeded={finalizer} onFailed={anonymizer} />
            );
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

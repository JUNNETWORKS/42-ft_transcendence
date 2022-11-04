import {
  userAtoms,
  authFlowStateAtom,
  storedCredentialAtom,
} from '@/stores/atoms';
import {
  verifyOAuth2AuthorizationCode,
  FtAuthenticationFlowState,
} from './auth';
import { useQuery } from '@/hooks';
import { useAtom } from 'jotai';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DevAuthenticatedCard,
  DevAuthLoginCard,
  DevAuthValidatingCard,
} from './AuthCard';

export const DevAuth = () => {
  const [authState, setAuthState] = useAtom(authFlowStateAtom);
  const [, setStoredCredential] = useAtom(storedCredentialAtom);
  const [, setPersonalData] = useAtom(userAtoms.personalDataAtom);

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

  const anonymizeAuthFlow = () => {
    setStoredCredential(null);
    setPersonalData(null);
    setAuthState('NotAuthenticated');
    setFtAuthState('Neutral');
  };

  const finalizeAuthFlow = (token: string, user: any) => {
    setStoredCredential({ token });
    setPersonalData(user);
    setFtAuthState('Neutral');
    setAuthState('Authenticated');
  };

  // 42認証フローのチェックと状態遷移
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
        verifyOAuth2AuthorizationCode(
          ftAuthCode,
          finalizeAuthFlow,
          anonymizeAuthFlow
        );
        break;
      }
    }
  }, [ftAuthState]);

  const presentator = (() => {
    switch (ftAuthState) {
      case 'NeutralAuthorizationCode':
      case 'ValidatingAuthorizationCode':
        return <DevAuthValidatingCard />;
      default:
        switch (authState) {
          case 'Neutral':
          case 'Validating':
            return <DevAuthValidatingCard />;
          case 'Authenticated':
            return <DevAuthenticatedCard onLogout={anonymizeAuthFlow} />;
          case 'NotAuthenticated':
            return (
              <DevAuthLoginCard
                onSucceeded={finalizeAuthFlow}
                onFailed={anonymizeAuthFlow}
              />
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

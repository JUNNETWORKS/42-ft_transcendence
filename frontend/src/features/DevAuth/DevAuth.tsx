import { useAtom } from 'jotai';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import { Modal } from '@/components/Modal';
import { useQuery } from '@/hooks';
import { authAtom, useLoginLocal, useLogout } from '@/stores/auth';
import { modalAtom } from '@/stores/control';

import {
  verifyOAuth2AuthorizationCode,
  FtAuthenticationFlowState,
} from './auth';
import {
  DevAuthenticatedCard,
  DevAuthLoginCard,
  DevAuthValidatingCard,
  TotpAuthForm,
} from './AuthCard';

export const DevAuth = () => {
  const [authState] = useAtom(authAtom.authFlowState);

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
  const loginLocal = useLoginLocal();
  const logout = useLogout();
  const [token2FA, setToken2FA] = useState<string | null>(null);
  const [, setIsOpenCreatedForm] = useAtom(modalAtom.isOpenCreateForm);

  const anonymizeAuthFlow = () => {
    logout();
    setToken2FA(null);
    setFtAuthState('Neutral');
  };

  const finalizeAuthFlow = (token: string, user: any, required2fa: boolean) => {
    if (required2fa) {
      setToken2FA(token);
      return;
    }
    setToken2FA(null);
    loginLocal(token, user);
    console.log('user', user);
    setFtAuthState('Neutral');
    if (user.created) {
      setIsOpenCreatedForm(true);
    }
    toast(`${user.displayName} としてログインしました`);
    navigation('/', { replace: true });
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
        verifyOAuth2AuthorizationCode(ftAuthCode, finalizeAuthFlow, () => {
          anonymizeAuthFlow();
          toast.error(`認証に失敗しました`, { autoClose: 5000 });
        });
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
    <>
      <Modal closeModal={() => anonymizeAuthFlow()} isOpen={!!token2FA}>
        {token2FA && (
          <TotpAuthForm
            token2FA={token2FA}
            onClose={() => anonymizeAuthFlow()}
            onSucceeded={finalizeAuthFlow}
          />
        )}
      </Modal>

      <div className="flex flex-1 flex-col items-center justify-center gap-32 ">
        <div
          className="basis-1 border-4 border-white"
          style={{ width: '28rem' }}
        >
          {presentator}
        </div>
      </div>
    </>
  );
};

import { authAtom, storedCredentialAtom } from '@/atoms/auth';
import { useAtom } from 'jotai';
import { useEffect } from 'react';
import { verifyCredential } from '@/auth';

/**
 * 認証状態の状態遷移
 */
export const AuthChecker = () => {
  const [storedCredential] = useAtom(storedCredentialAtom);
  const [authState, setAuthState] = useAtom(authAtom.authFlowState);
  const setPersonalData = useAtom(authAtom.personalData)[1];

  useEffect(() => {
    switch (authState) {
      case 'Neutral': {
        setAuthState('Validating');
        break;
      }
      case 'Validating':
        // GET /auth/session を呼んでローカルのクレデンシャルをユーザ情報に変換
        verifyCredential(
          storedCredential,
          (user) => {
            // ユーザ情報に変換できた場合の処理
            setPersonalData(user);
            setAuthState('Authenticated');
          },
          () => {
            // 変換できなかった場合の処理
            setPersonalData(null);
            setAuthState('NotAuthenticated');
          }
        );
        break;
      case 'NotAuthenticated':
        break;
    }
  }, [authState]);

  return <></>;
};

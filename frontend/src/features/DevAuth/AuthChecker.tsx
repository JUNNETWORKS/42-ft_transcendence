import {
  authFlowStateAtom,
  storedCredentialAtom,
  userAtoms,
} from '@/stores/atoms';
import { useAtom } from 'jotai';
import { useEffect } from 'react';
import { verifyCredential } from './auth';

export const AuthChecker = () => {
  // 認証フローのチェックと状態遷移
  const [storedCredential] = useAtom(storedCredentialAtom);
  const [authState, setAuthState] = useAtom(authFlowStateAtom);
  const [, setPersonalData] = useAtom(userAtoms.personalDataAtom);

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

  return null;
};

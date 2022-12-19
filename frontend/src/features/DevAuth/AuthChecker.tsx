import { useAtom } from 'jotai';
import { useEffect } from 'react';

import { authAtom, storedCredentialAtom } from '@/stores/auth';
import { useUpdateUser } from '@/stores/store';

import { popAuthError } from '../Toaster/toast';
import { verifyCredential } from './auth';

/**
 * 認証状態の状態遷移
 */
export const AuthChecker = () => {
  const [storedCredential, setStoredCredential] = useAtom(storedCredentialAtom);
  const [authState, setAuthState] = useAtom(authAtom.authFlowState);
  const [, setPersonalData] = useAtom(authAtom.personalData);
  const { addOne } = useUpdateUser();

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
            addOne(user);
            setAuthState('Authenticated');
          },
          (e?: any) => {
            // 変換できなかった場合の処理
            if (e) {
              if (e instanceof TypeError) {
                popAuthError(
                  'ネットワークエラーのため認証状態が確認できませんでした'
                );
              } else {
                // ネットワークエラー**以外**の時だけクレデンシャルを削除する
                popAuthError(
                  '認証情報が確認できなかったため、再度認証してください'
                );
                setStoredCredential(null);
                setPersonalData(null);
              }
            }
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

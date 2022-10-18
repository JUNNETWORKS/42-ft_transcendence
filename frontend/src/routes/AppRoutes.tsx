import { useRoutes } from 'react-router-dom';
import { Chat } from '@/features/Chat/Chat';
import { Pong } from '@/features/Pong/components/Pong';
import { Index } from '@/features/Index/Index';
import { DevAuth } from '@/features/DevAuth/DevAuth';
import {
  authFlowStateAtom,
  personalDataAtom,
  chatSocketAtom,
  storedCredentialAtom,
} from '@/atoms';
import { useAtom } from 'jotai';
import { useEffect } from 'react';
import { verifyCredential } from '@/auth';
import { UserView } from '@/features/User/User';

export const AppRoutes = () => {
  // 「ソケット」
  // 認証されていない場合はnull
  const [mySocket] = useAtom(chatSocketAtom);

  // 認証フローのチェックと状態遷移
  {
    const [storedCredential] = useAtom(storedCredentialAtom);
    const [authState, setAuthState] = useAtom(authFlowStateAtom);
    const setPersonalData = useAtom(personalDataAtom)[1];

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
  }

  const authElement = <DevAuth />;
  const guardElement = !mySocket ? authElement : null;
  const commonRoutes = [
    { path: '/', element: <Index /> },
    { path: '/pong', element: <Pong /> },
    { path: '/auth', element: authElement },
    { path: '/chat', element: guardElement || <Chat mySocket={mySocket!} /> },
    { path: '/user/:id', element: guardElement || <UserView /> },
  ];
  const routeElements = useRoutes([...commonRoutes]);

  return <>{routeElements}</>;
};

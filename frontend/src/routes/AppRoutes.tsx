import { useRoutes } from 'react-router-dom';
import { Chat } from '@/features/Chat/Chat';
import { Pong } from '@/features/Pong/components/Pong';
import { Index } from '@/features/Index/Index';
import { DevAuth } from '@/features/DevAuth/DevAuth';
import {
  authFlowStateAtom,
  personalDataAtom,
  socketAtom,
  storedCredentialAtom,
} from '@/atoms';
import { useAtom } from 'jotai';
import { useEffect } from 'react';
import { callSession } from '@/auth';

export const AppRoutes = () => {
  // ブラウザが保持しているクレデンシャル
  const [mySocket] = useAtom(socketAtom);
  const [storedCredential] = useAtom(storedCredentialAtom);
  const [authState, setAuthState] = useAtom(authFlowStateAtom);
  const setPersonalData = useAtom(personalDataAtom)[1];

  // 認証状態のチェック
  useEffect(() => {
    switch (authState) {
      case 'Neutral': {
        setAuthState('Validating');
        break;
      }
      case 'Validating':
        // GET /auth/session を呼んでユーザ情報を取得
        callSession(
          storedCredential,
          (user) => {
            setPersonalData(user);
            setAuthState('Authenticated');
          },
          () => {
            setPersonalData(null);
            setAuthState('NotAuthenticated');
          }
        );
        break;
      case 'NotAuthenticated':
        break;
    }
  }, [authState]);

  const authElement = <DevAuth />;
  const commonRoutes = [
    { path: '/', element: <Index /> },
    { path: '/auth', element: authElement },
    { path: '/pong', element: <Pong /> },
  ];
  if (mySocket) {
    commonRoutes.push({ path: '/chat', element: <Chat mySocket={mySocket} /> });
  } else {
    commonRoutes.push({ path: '/chat', element: authElement });
  }
  const routeElements = useRoutes([...commonRoutes]);

  return <>{routeElements}</>;
};

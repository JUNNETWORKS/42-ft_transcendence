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

const apiHost = `http://localhost:3000`;

export const AppRoutes = () => {
  // ブラウザが保持しているクレデンシャル
  const [mySocket] = useAtom(socketAtom);
  const [storedCredential] = useAtom(storedCredentialAtom);
  const [authState, setAuthState] = useAtom(authFlowStateAtom);
  const setPersonalData = useAtom(personalDataAtom)[1];

  const callSession = async (
    onSucceeded: (user: any) => void,
    onFailed: () => void
  ) => {
    console.log({ storedCredential });
    if (storedCredential && storedCredential.token) {
      console.log(`calling cs`);
      try {
        const result = await fetch(`${apiHost}/auth/session`, {
          method: 'GET',
          mode: 'cors',
          headers: {
            Authorization: `Bearer ${storedCredential.token}`,
          },
        });
        const json = await result.json();
        console.log('cs', json);
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
    }
  }, [authState]);

  const commonRoutes = [
    { path: '/chat', element: mySocket ? <Chat mySocket={mySocket} /> : <></> },
    { path: '/', element: <Index /> },
    { path: '/auth', element: <DevAuth /> },
    { path: '/pong', element: <Pong /> },
  ];
  const routeElements = useRoutes([...commonRoutes]);

  return <>{routeElements}</>;
};

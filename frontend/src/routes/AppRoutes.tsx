import { useRoutes } from 'react-router-dom';
import { Chat } from '@/features/Chat/Chat';
import { Pong } from '@/features/Pong/components/Pong';
import { Index } from '@/features/Index/Index';
import { DevAuth } from '@/features/DevAuth/DevAuth';
import { useRecoilValue } from 'recoil';
import { socketAtom } from '@/atoms';

export const AppRoutes = () => {
  const mySocket = useRecoilValue(socketAtom);

  const commonRoutes = [
    { path: '/chat', element: mySocket ? <Chat mySocket={mySocket} /> : <></> },
    { path: '/', element: <Index /> },
    { path: '/auth', element: <DevAuth /> },
    { path: '/pong', element: <Pong /> },
  ];
  const routeElements = useRoutes([...commonRoutes]);

  return <>{routeElements}</>;
};

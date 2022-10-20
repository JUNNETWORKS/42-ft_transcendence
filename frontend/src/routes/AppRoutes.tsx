import { useRoutes } from 'react-router-dom';
import { Chat } from '@/features/Chat/Chat';
import { Pong } from '@/features/Pong/components/Pong';
import { Index } from '@/features/Index/Index';
import { DevAuth } from '@/features/DevAuth/DevAuth';
import { chatSocketAtom } from '@/atoms';
import { useAtom } from 'jotai';
import { UserView } from '@/features/User/User';
import { SocketHolder } from './SocketHolder';
import { AuthChecker } from './AuthChecker';

export const AppRoutes = () => {
  const [mySocket] = useAtom(chatSocketAtom);
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

  return (
    <>
      <AuthChecker />
      <SocketHolder />
      {routeElements}
    </>
  );
};

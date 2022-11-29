import { useRoutes } from 'react-router-dom';
import { Chat } from '@/features/Chat/Chat';
import { Pong } from '@/features/Pong/components/Pong';
import { Index } from '@/features/Index/Index';
import { DevAuth } from '@/features/DevAuth/DevAuth';
import { chatSocketAtom } from '@/stores/auth';
import { useAtom } from 'jotai';
import { UserView } from '@/features/User/UserView';
import { GamePage } from '@/features/GamePage/components/GamePage';
import { MyPageView } from '@/features/User/MyPage';
import { DmPage } from '@/features/DM/DmPage';

export const AppRoutes = () => {
  const [mySocket] = useAtom(chatSocketAtom);
  const authElement = <DevAuth />;
  const guardElement = !mySocket ? authElement : null;
  const commonRoutes = [
    { path: '/', element: <Index /> },
    { path: '/pong', element: <Pong /> },
    { path: '/auth', element: authElement },
    { path: '/chat', element: guardElement || <Chat mySocket={mySocket!} /> },
    { path: '/dm', element: guardElement || <DmPage mySocket={mySocket!} /> },
    { path: '/user/:id', element: guardElement || <UserView /> },
    { path: '/game/markup', element: <GamePage /> },
    { path: '/me/*', element: <MyPageView /> },
  ];
  const routeElements = useRoutes([...commonRoutes]);

  return <>{routeElements}</>;
};

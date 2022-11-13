import { useRoutes } from 'react-router-dom';
import { Chat } from '@/features/Chat/Chat';
import { PongMatchPage } from '@/features/Pong/components/MatchPage';
import { Index } from '@/features/Index/Index';
import { DevAuth } from '@/features/DevAuth/DevAuth';
import { chatSocketAtom } from '@/stores/atoms';
import { useAtom } from 'jotai';
import { UserView } from '@/features/User/User';
import { PongTopPage } from '@/features/Pong/components/TopPage';
import { MyPageView } from '@/features/User/MyPage';

export const AppRoutes = () => {
  const [mySocket] = useAtom(chatSocketAtom);
  const authElement = <DevAuth />;
  const guardElement = !mySocket ? authElement : null;
  const commonRoutes = [
    { path: '/', element: <Index /> },
    { path: '/pong', element: <PongTopPage /> },
    { path: '/pong/matches/:matchID', element: <PongMatchPage /> },
    { path: '/auth', element: authElement },
    { path: '/chat', element: guardElement || <Chat mySocket={mySocket!} /> },
    { path: '/user/:id', element: guardElement || <UserView /> },
    { path: '/me/*', element: <MyPageView /> },
  ];
  const routeElements = useRoutes([...commonRoutes]);

  return <>{routeElements}</>;
};

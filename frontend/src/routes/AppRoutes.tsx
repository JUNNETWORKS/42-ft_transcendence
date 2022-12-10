import { useAtom } from 'jotai';
import { useRoutes } from 'react-router-dom';

import { Chat } from '@/features/Chat/Chat';
import { ChatRoomView } from '@/features/Chat/ChatRoomView';
import { VisibleRoomList } from '@/features/Chat/VisibleRoomList';
import { DevAuth } from '@/features/DevAuth/DevAuth';
import { DmPage } from '@/features/DM/DmPage';
import { DmRoomView } from '@/features/DM/DmRoomView';
import { Index } from '@/features/Index/Index';
import { PongMatchPage } from '@/features/Pong/components/MatchPage';
import { PongTopPage } from '@/features/Pong/components/TopPage';
import { MyPageView } from '@/features/User/MyPage';
import { UserView } from '@/features/User/UserView';
import { chatSocketAtom } from '@/stores/auth';

export const AppRoutes = () => {
  const [mySocket] = useAtom(chatSocketAtom);
  const authElement = <DevAuth />;
  const guardElement = !mySocket ? authElement : null;
  const routeElements = useRoutes([
    { path: '/', element: guardElement || <Index /> },
    {
      path: '/pong',
      element: guardElement || <PongTopPage mySocket={mySocket!} />,
    },
    {
      path: '/pong/matches/:matchID',
      element: guardElement || <PongMatchPage mySocket={mySocket!} />,
    },
    {
      path: '/auth',
      element: authElement,
    },
    {
      path: '/chat',
      element: guardElement || <Chat mySocket={mySocket!} />,
      children: [
        {
          path: '',
          element: <VisibleRoomList />,
        },
        {
          path: ':id',
          element: <ChatRoomView />,
        },
      ],
    },
    {
      path: '/dm',
      element: guardElement || <DmPage mySocket={mySocket!} />,
      children: [
        {
          path: ':id',
          element: <DmRoomView />,
        },
      ],
    },
    {
      path: '/user/:id',
      element: guardElement || <UserView />,
    },
    {
      path: '/me/*',
      element: guardElement || <MyPageView />,
    },
    {
      path: '/*',
      element: guardElement || <Index />,
    },
  ]);

  return <>{routeElements}</>;
};

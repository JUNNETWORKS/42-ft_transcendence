import { useRoutes } from 'react-router-dom';
import { Chat } from '@/features/Chat/Chat';
import { Pong } from '@/features/Pong/components/Pong';
import { Index } from '@/features/Index/Index';
import { DevAuth } from '@/features/DevAuth/DevAuth';

export const AppRoutes = () => {
  const commonRoutes = [
    { path: '/chat', element: <Chat /> },
    { path: '/', element: <Index /> },
    { path: '/auth', element: <DevAuth /> },
    { path: '/pong', element: <Pong /> },
  ];
  const routeElements = useRoutes([...commonRoutes]);

  return <>{routeElements}</>;
};

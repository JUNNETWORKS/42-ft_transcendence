import { useRoutes } from 'react-router-dom';
import { Chat } from '@/features/Chat/Chat';
import { Pong } from '@/features/Pong/components/Pong';
import { Index } from '@/features/Index/Index';
import { DevLogin } from '@/features/DevLogin/DevLogin';

export const AppRoutes = () => {
  const commonRoutes = [
    { path: '/chat', element: <Chat /> },
    { path: '/', element: <Index /> },
    { path: '/login', element: <DevLogin /> },
    { path: '/pong', element: <Pong /> },
  ];
  const routeElements = useRoutes([...commonRoutes]);

  return <>{routeElements}</>;
};

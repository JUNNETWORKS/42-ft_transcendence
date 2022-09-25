import { useRoutes } from 'react-router-dom';
import { Hoge } from '@/features/Hoge/Hoge';
import { Chat } from '@/features/Chat/Chat';

export const AppRoutes = () => {
  const commonRoutes = [
    { path: '/', element: <Hoge /> },
    { path: '/chat', element: <Chat /> },
  ];
  const routeElements = useRoutes([...commonRoutes]);

  return <>{routeElements}</>;
};

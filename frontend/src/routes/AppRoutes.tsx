import { useRoutes } from 'react-router-dom';
import { Hoge } from '@/features/Hoge/Hoge';
import { Pong } from '@/features/Pong/components/Pong';

export const AppRoutes = () => {
  const commonRoutes = [
    { path: '/', element: <Hoge /> },
    { path: '/pong', element: <Pong /> },
  ];
  const routeElements = useRoutes([...commonRoutes]);

  return <>{routeElements}</>;
};

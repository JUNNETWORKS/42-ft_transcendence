import { useRoutes } from 'react-router-dom';
import { Pong } from '@/features/Pong/components/Pong';
import { Index } from '@/features/Index/Index';

export const AppRoutes = () => {
  const commonRoutes = [
    { path: '/', element: <Index /> },
    { path: '/pong', element: <Pong /> },
  ];
  const routeElements = useRoutes([...commonRoutes]);

  return <>{routeElements}</>;
};

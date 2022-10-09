import { useRoutes } from 'react-router-dom';
import { Hoge } from '@/features/Hoge/Hoge';
import { Index } from '@/features/index/index';

export const AppRoutes = () => {
  const commonRoutes = [
    { path: '/', element: <Index /> },
    { path: '/Hoge', element: <Hoge /> },
  ];
  const routeElements = useRoutes([...commonRoutes]);

  return <>{routeElements}</>;
};

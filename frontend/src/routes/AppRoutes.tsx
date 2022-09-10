import { useRoutes } from 'react-router-dom';
import { Hoge } from '@/features/Hoge/Hoge';

export const AppRoutes = () => {
  const commonRoutes = [{ path: '/', element: <Hoge /> }];
  const routeElements = useRoutes([...commonRoutes]);

  return <>{routeElements}</>;
};

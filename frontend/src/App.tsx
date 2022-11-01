import { AppRoutes } from '@/routes/AppRoutes';
import { AppProvider } from '@/providers/AppProvider';
import { AuthChecker } from './routes/AuthChecker';
import { SocketHolder } from './routes/SocketHolder';
import '../index.css';

export const App = () => {
  return (
    <AppProvider>
      <AppRoutes />
      <AuthChecker />
      <SocketHolder />
    </AppProvider>
  );
};

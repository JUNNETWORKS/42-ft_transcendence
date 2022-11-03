import { AppRoutes } from '@/routes/AppRoutes';
import { AppProvider } from '@/providers/AppProvider';
import { AuthChecker } from '@/containers/AuthChecker';
import { SocketHolder } from '@/containers/SocketHolder';
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

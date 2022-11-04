import { AppRoutes } from '@/routes/AppRoutes';
import { AppProvider } from '@/providers/AppProvider';
import { AuthChecker } from '@/features/DevAuth/AuthChecker';
import { SocketHolder } from '@/features/Socket/SocketHolder';
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

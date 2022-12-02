import { AuthChecker } from '@/features/DevAuth/AuthChecker';
import { SocketHolder } from '@/features/Socket/SocketHolder';
import { AppProvider } from '@/providers/AppProvider';
import { AppRoutes } from '@/routes/AppRoutes';

import '../index.css';
import { useConfirmModalComponent } from './hooks/useConfirmModal';

export const App = () => {
  const ConfirmModal = useConfirmModalComponent();
  return (
    <AppProvider>
      <AppRoutes />
      <AuthChecker />
      <SocketHolder />
      <ConfirmModal />
    </AppProvider>
  );
};

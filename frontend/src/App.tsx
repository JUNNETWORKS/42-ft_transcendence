import { AuthChecker } from '@/features/DevAuth/AuthChecker';
import { SocketHolder } from '@/features/Socket/SocketHolder';
import { AppProvider } from '@/providers/AppProvider';
import { AppRoutes } from '@/routes/AppRoutes';

import { UserFormHolder } from './features/DevAuth/UserFormHolder';
import { ToastHolder } from './features/Toaster/ToastHolder';
import { UserCardHolder } from './features/User/UserCardHolder';
import { useConfirmModalComponent } from './hooks/useConfirmModal';

import '../index.css';

export const App = () => {
  const ConfirmModal = useConfirmModalComponent();
  return (
    <AppProvider>
      <AppRoutes />
      <AuthChecker />
      <SocketHolder />
      <ToastHolder />
      <ConfirmModal />
      <UserFormHolder />
      <UserCardHolder />
    </AppProvider>
  );
};

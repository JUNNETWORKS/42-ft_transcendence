import { AppRoutes } from '@/routes/AppRoutes';
import { AppProvider } from '@/providers/AppProvider';
import { AuthChecker } from '@/features/DevAuth/AuthChecker';
import { SocketHolder } from '@/features/Socket/SocketHolder';
import { ToastHolder } from './features/Toaster/ToastHolder';
import '../index.css';
import { useConfirmModalComponent } from './hooks/useConfirmModal';

export const App = () => {
  const ConfirmModal = useConfirmModalComponent();
  return (
    <AppProvider>
      <AppRoutes />
      <AuthChecker />
      <SocketHolder />
      <ToastHolder />
      <ConfirmModal />
    </AppProvider>
  );
};

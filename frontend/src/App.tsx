import { AppRoutes } from '@/routes/AppRoutes';
import { AppProvider } from '@/providers/AppProvider';
import { RecoilRoot } from 'recoil';
import '../index.css';

export const App = () => {
  return (
    <AppProvider>
      <RecoilRoot>
        <AppRoutes />
      </RecoilRoot>
    </AppProvider>
  );
};

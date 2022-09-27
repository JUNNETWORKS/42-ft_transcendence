import { AppRoutes } from '@/routes/AppRoutes';
import { AppProvider } from '@/providers/AppProvider';
import '../index.css';
import '../fonts/PixelMplus12-Bold.ttf';
import '../fonts/PixelMplus12-Regular.ttf';

export const App = () => {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  );
};

import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { Theme } from '@/providers/Theme';
import { Layout } from '@/providers/Layout';

type AppProviderProps = {
  children: React.ReactNode;
};

export const AppProvider = ({ children }: AppProviderProps) => {
  return (
    <ThemeProvider theme={Theme}>
      <BrowserRouter>
        <Layout>{children}</Layout>
      </BrowserRouter>
    </ThemeProvider>
  );
};

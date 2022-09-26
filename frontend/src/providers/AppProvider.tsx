import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { Theme } from '@/providers/Theme';

type AppProviderProps = {
  children: React.ReactNode;
};

export const AppProvider = ({ children }: AppProviderProps) => {
  return (
    <ThemeProvider theme={Theme}>
      <BrowserRouter>{children}</BrowserRouter>
    </ThemeProvider>
  );
};

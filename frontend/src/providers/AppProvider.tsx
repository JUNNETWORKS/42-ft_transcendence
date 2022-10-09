import { BrowserRouter } from 'react-router-dom';
import { Layout } from './Layout';

type AppProviderProps = {
  children: React.ReactNode;
};

export const AppProvider = ({ children }: AppProviderProps) => {
  return (
    <Layout>
      <BrowserRouter>{children}</BrowserRouter>
    </Layout>
  );
};

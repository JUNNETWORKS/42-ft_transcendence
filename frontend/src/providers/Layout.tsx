import { ReactNode } from 'react';
import { NavBar } from '@/components/NavBar';

type Props = {
  children: ReactNode;
};
export const Layout = ({ children }: Props) => {
  return (
    <>
      <NavBar />
      {children}
    </>
  );
};

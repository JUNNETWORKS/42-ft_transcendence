import { NavBar } from '@/Components/NavBar';
import { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

export function Layout({ children }: Props) {
  return (
    <>
      <NavBar />
      {children}
    </>
  );
}

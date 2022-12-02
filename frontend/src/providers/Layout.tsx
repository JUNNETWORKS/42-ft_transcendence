import { ReactNode } from 'react';

import { NavBar } from '@/components/NavBar';

type Props = {
  children: ReactNode;
};
export const Layout = ({ children }: Props) => {
  return (
    <div className="flex h-screen flex-col">
      <NavBar />
      <div className="flex flex-1">{children}</div>
    </div>
  );
};

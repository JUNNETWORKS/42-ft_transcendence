import { ReactNode } from 'react';

import { useUserCard } from '@/stores/control';
import { User } from '@/typedef';

type Prop = {
  className?: string;
  user?: User;
  button?: ReactNode;
  children?: JSX.Element;
};

export const PopoverUserCard = ({
  className,
  user,
  button,
  children,
}: Prop) => {
  const openCard = useUserCard();
  if (!user && !button) {
    return null;
  }
  const inner = () => {
    if (button) {
      return button;
    }
    if (user) {
      return (
        <div
          className="max-w-[20em] overflow-hidden text-ellipsis px-1 align-middle font-bold hover:underline"
          onClick={() => openCard(user, children || undefined)}
        >
          {user.displayName}
        </div>
      );
    }
    return null;
  };
  return (
    <div
      className={`relative inline-block cursor-pointer align-middle ${
        className || ''
      }`}
    >
      {inner()}
    </div>
  );
};

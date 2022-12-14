import { useEffect, useState } from 'react';

import { getOnlineStatusColor } from '@/features/User/utils';
import { Icons } from '@/icons';
import * as TD from '@/typedef';

type Prop = {
  user: TD.User;
};

// Lv. 2
export const OnlineStatusDot = ({ user }: Prop) => {
  const [color, setColor] = useState(getOnlineStatusColor(user));
  useEffect(() => {
    const timer = setInterval(() => {
      setColor(getOnlineStatusColor(user));
    }, 1000);
    return () => clearInterval(timer);
  }, [user]);
  return <Icons.User.StatusDot className={color} />;
};

import { useEffect, useState } from 'react';

import { getOnlineStatus, getOnlineStatusColor } from '@/features/User/utils';
import * as TD from '@/typedef';

type Prop = {
  user: TD.User;
};

// Lv. 2
export const OnlineStatusLabel = ({ user }: Prop) => {
  const [color, setColor] = useState(getOnlineStatusColor(user));
  const [text, setText] = useState(getOnlineStatus(user));
  useEffect(() => {
    const timer = setInterval(() => {
      setColor(getOnlineStatusColor(user));
      setText(getOnlineStatus(user));
    }, 1000);
    return () => clearInterval(timer);
  }, [user]);
  return <p className={`${color} text-center font-bold`}>{text}</p>;
};

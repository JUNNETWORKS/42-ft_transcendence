import { useEffect, useState } from 'react';

import { Icons } from '@/icons';
import * as TD from '@/typedef';

const activeTimeMs = 60 * 1000;

type Prop = {
  user: TD.User;
};

// Lv. 2
export const OnlineStatusDot = ({ user }: Prop) => {
  const onlineStatusColor = (user: TD.User) => {
    if (user) {
      if (user.pulseTime) {
        if (Date.now() - user.pulseTime.getTime() < activeTimeMs) {
          return 'text-green-500';
        } else {
          return 'text-orange-500';
        }
      }
    }
    return 'text-slate-500';
  };
  const [color, setColor] = useState(onlineStatusColor(user));
  useEffect(() => {
    const timer = setInterval(() => {
      setColor(onlineStatusColor(user));
    }, 1000);
    return () => clearInterval(timer);
  }, [user]);
  return <Icons.User.StatusDot className={color} />;
};

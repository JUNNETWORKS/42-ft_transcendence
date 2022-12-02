import { useEffect, useState } from 'react';

import { Icons } from '@/icons';
import { useUserDataReadOnly } from '@/stores/store';
import * as TD from '@/typedef';

const activeTimeMs = 60 * 1000;

export const OnlineStatusDot = (props: { user: TD.User }) => {
  const user = useUserDataReadOnly(props.user.id);
  const onlineStatusColor = (user: TD.User) => {
    if (user && user.time) {
      if (Date.now() - user.time.getTime() < activeTimeMs) {
        return 'text-green-500';
      } else {
        return 'text-orange-500';
      }
    } else {
      return 'text-slate-500';
    }
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

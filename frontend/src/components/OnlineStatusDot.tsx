import * as TD from '@/typedef';
import { useUserDataReadOnly } from '@/stores/store';
import { useEffect, useState } from 'react';
import { Icons } from '@/icons';

const activeTimeMs = 60 * 1000;

export const OnlineStatusDot = (props: { user: TD.User }) => {
  const user = useUserDataReadOnly(props.user.id);
  const onlineStatusColor = (user: TD.User) => {
    if (user.time) {
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
  const [now] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setColor(onlineStatusColor(user));
    }, 1000);
    return () => clearInterval(timer);
  }, [now, user]);
  return <Icons.User.StatusDot className={color} />;
};

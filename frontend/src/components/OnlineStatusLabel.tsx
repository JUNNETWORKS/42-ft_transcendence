import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getOnlineStatus, getOnlineStatusColor } from '@/features/User/utils';
import * as TD from '@/typedef';

import { FTButton } from './FTBasicComponents';

type Prop = {
  user: TD.User;
};

// Lv. 2
export const OnlineStatusLabel = ({ user }: Prop) => {
  const [color, setColor] = useState(getOnlineStatusColor(user));
  const [text, setText] = useState(getOnlineStatus(user));
  const navigate = useNavigate();
  useEffect(() => {
    const timer = setInterval(() => {
      setColor(getOnlineStatusColor(user));
      setText(getOnlineStatus(user));
    }, 1000);
    return () => clearInterval(timer);
  }, [user]);
  return (
    <>
      <p className="text-center">
        <span className={`${color} font-bold`}>{text}</span>
        {text === 'Playing' && (
          <FTButton
            className="ml-1"
            onClick={() => navigate(`/pong/matches/${user.ongoingMatchId!}`)}
          >
            観戦
          </FTButton>
        )}
      </p>
    </>
  );
};

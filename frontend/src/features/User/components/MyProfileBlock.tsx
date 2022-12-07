import dayjs from 'dayjs';

import { FTH4 } from '@/components/FTBasicComponents';
import { User } from '@/typedef';
import { UserPersonalData } from '@/types';

type Prop =
  | {
      user: UserPersonalData;
      isYou: true;
    }
  | {
      user: User;
      isYou: false;
    };

// Lv2.
export const MyProfileBlock = ({ user, isYou }: Prop) => {
  return (
    <div className="shrink grow overflow-hidden">
      <FTH4 className="">id</FTH4>
      <p className="p-1">{user.id}</p>

      {isYou ? (
        <>
          <FTH4 className="">email</FTH4>
          <div className="overflow-hidden truncate p-1">{user.email}</div>
        </>
      ) : (
        <>
          <FTH4 className="">status</FTH4>
          <p className="p-1">
            {user.time ? dayjs(user.time).format('MM/DD HH:mm:ss') : 'offline'}
          </p>
        </>
      )}
    </div>
  );
};

import dayjs from 'dayjs';

import { FTH4 } from '@/components/FTBasicComponents';
import { UserAvatar } from '@/components/UserAvater';
import { UserPersonalData } from '@/stores/auth';
import { User } from '@/typedef';

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
    <>
      <div className="shrink-0 grow-0">
        <FTH4>&nbsp;</FTH4>
        <UserAvatar
          className="h-24 w-24 border-8 border-solid border-gray-700"
          user={user}
        />
      </div>
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
              {user.time
                ? dayjs(user.time).format('MM/DD HH:mm:ss')
                : 'offline'}
            </p>
          </>
        )}
      </div>
    </>
  );
};

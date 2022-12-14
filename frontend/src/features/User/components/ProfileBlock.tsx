import { FTH4 } from '@/components/FTBasicComponents';
import { OnlineStatusLabel } from '@/components/OnlineStatusLabel';
import { UserAvatar } from '@/components/UserAvater';
import { UserPersonalData } from '@/stores/auth';
import { User } from '@/typedef';

type Prop =
  | {
      user: UserPersonalData;
      isYou: true;
      onClose?: () => void;
    }
  | {
      user: User;
      isYou: false;
      onClose?: () => void;
    };

// Lv2.
export const ProfileBlock = ({ user, isYou, onClose }: Prop) => {
  return (
    <div className="flex flex-row">
      <div className="shrink-0 grow-0">
        <FTH4>&nbsp;</FTH4>
        <UserAvatar
          className="h-24 w-24 border-8 border-solid border-gray-700"
          user={user}
        />
      </div>
      <div className="shrink grow overflow-hidden">
        <FTH4 className="">id</FTH4>
        <div className="overflow-hidden truncate p-1">{user.id}</div>
        <FTH4 className="">status</FTH4>
        <div className="p-1">
          <OnlineStatusLabel user={user} onClose={onClose} />
        </div>
      </div>
    </div>
  );
};

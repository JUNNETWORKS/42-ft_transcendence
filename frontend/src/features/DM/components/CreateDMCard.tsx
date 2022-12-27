import { useAtom } from 'jotai';
import { useState } from 'react';

import { FTH3, FTH4 } from '@/components/FTBasicComponents';
import { UserAvatar } from '@/components/UserAvater';
import { Constants } from '@/constants';
import { UserSelectList } from '@/features/Chat/components/UserSelectList';
import { authAtom, chatSocketAtom } from '@/stores/auth';
import { displayUser, DmRoom } from '@/typedef';

import { DmCard } from '../DmCard';

type Prop = {
  closeModal: () => void;
  dmRooms: DmRoom[];
};

export const CreateDMCard = ({ closeModal, dmRooms }: Prop) => {
  const [mySocket] = useAtom(chatSocketAtom);
  const [personalData] = useAtom(authAtom.personalData);
  const take = 5;
  const [selectedUser, setSelectedUser] = useState<displayUser | null>(null);
  const isDisabled = (user: displayUser) =>
    !!dmRooms.find((r) => {
      return !!r.roomMember.find((m) => m.userId === user.id);
    });
  if (!personalData || !mySocket) return null;

  const toContent = selectedUser ? (
    <>
      <UserAvatar className={`m-1 h-6 w-6`} user={selectedUser} />
      <p className={`shrink grow overflow-hidden text-ellipsis`}>
        {selectedUser.displayName}
      </p>
    </>
  ) : (
    <p className="w-full text-center">{'<none>'}</p>
  );
  return (
    <div className="flex w-80 flex-col border-2 border-solid border-white bg-black">
      <FTH3>Sending DM</FTH3>
      <UserSelectList
        makeUrl={(take, cursor) =>
          `${Constants.backendHost}/users?take=${take}&cursor=${cursor}`
        }
        take={take}
        isDisabled={isDisabled}
        onSelect={setSelectedUser}
      />
      <FTH4 className="text-sm">To</FTH4>
      <div className="flex h-8 flex-row items-center">{toContent}</div>
      <div className="p-2">
        <DmCard user={selectedUser || undefined} bordered={true} />
      </div>
    </div>
  );
};

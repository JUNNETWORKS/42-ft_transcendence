import { useState } from 'react';

import { FillerBlock } from '@/components/FillerBlock';
import { FTButton, FTH3 } from '@/components/FTBasicComponents';
import { OnlineStatusDot } from '@/components/OnlineStatusDot';
import { UserAvatar } from '@/components/UserAvater';
import { useBlocking } from '@/hooks/useBlockings';
import { useFriends } from '@/hooks/useFriends';
import { Icons } from '@/icons';
import { useUserDataReadOnly } from '@/stores/store';
import { User } from '@/typedef';

import { UserCard } from './UserCard';

type ListItemProp = {
  user: User;
  selectedUserId?: number;
  onSelect: (user: User) => void;
};

const ListItem = ({ user: u, selectedUserId, onSelect }: ListItemProp) => {
  const user = useUserDataReadOnly(u.id);
  const isSelected = user.id === selectedUserId;
  return (
    <div
      className={`flex cursor-pointer flex-row items-center hover:bg-gray-700 ${
        isSelected ? 'bg-teal-900' : ''
      }`}
      onClick={() => onSelect(user)}
    >
      <div className="shrink-0 grow-0">
        <UserAvatar className="m-1 h-11 w-11" user={user} />
      </div>
      <div className="shrink-0 grow-0">
        <OnlineStatusDot user={user} />
      </div>
      <div className="shrink grow overflow-hidden text-ellipsis">
        {user.displayName}
      </div>
    </div>
  );
};

type ListProp = {
  selectedUserId?: number;
  onSelect: (user: User) => void;
};

const UserList = ({
  selectedUserId,
  onSelect,
  users,
}: ListProp & { users: User[] }) => {
  return (
    <div className="flex h-full w-full flex-col overflow-x-hidden overflow-y-scroll">
      {users.map((user) => {
        return (
          <ListItem
            key={user.id}
            user={user}
            selectedUserId={selectedUserId}
            onSelect={onSelect}
          />
        );
      })}
    </div>
  );
};

type CardProp = {
  users: User[];
  title: string;
  onClose: () => void;
};

const UserListCard = ({ users, title, onClose }: CardProp) => {
  const [user, setUser] = useState<User | null>(null);
  const selectedUserId = user?.id;
  const contentUnselected = (
    <div className="flex h-full shrink grow flex-col justify-center">
      <FillerBlock icon={Icons.NormalFace} message="click to select" />
    </div>
  );
  const content = (() => {
    if (users.length === 0) {
      return (
        <div className="flex w-full flex-col items-center gap-4 self-center justify-self-center">
          <FillerBlock icon={Icons.UnhappyFace} message="No User" />
        </div>
      );
    }
    return (
      <>
        <div className="shrink-0 grow-0 basis-[14em] overflow-hidden bg-gray-900">
          <UserList
            users={users}
            selectedUserId={selectedUserId}
            onSelect={(user) => setUser(user)}
          />
        </div>
        {(user && (
          <div className="relative shrink grow overflow-x-hidden overflow-y-scroll border-l-8 border-white">
            <UserCard id={user.id} fixedWidth={false} bordered={false} />
          </div>
        )) ||
          contentUnselected}
      </>
    );
  })();
  return (
    <div className="flex flex-col border-8 border-solid border-white">
      <FTH3 className="flex flex-row items-center text-xl">
        <FTButton className="shrink-0 grow-0 p-0" onClick={onClose}>
          <Icons.Cancel className="block" />
        </FTButton>
        <div className="shrink-0 grow-0">{title}</div>
      </FTH3>
      <div className="flex h-[20em] flex-row bg-black text-white">
        {content}
      </div>
    </div>
  );
};

type Prop = { onClose: () => void };

export const FriendList = (props: Prop) => {
  const [friends] = useFriends();
  return <UserListCard {...props} users={friends} title="Your Friends" />;
};

export const BlockingList = (props: Prop) => {
  const [blockings] = useBlocking();
  return <UserListCard {...props} users={blockings} title="You Blocking" />;
};

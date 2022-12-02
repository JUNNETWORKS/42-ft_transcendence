import { useAtom } from 'jotai';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { UserProfileModal } from '@/features/User/UserProfileModal';
import { authAtom } from '@/stores/auth';
import * as TD from '@/typedef';

import { Modal } from './Modal';
import { UserAvatar } from './UserAvater';

type UserCardProp = {
  user: TD.User;
};

const UserCard = ({ user }: UserCardProp) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Modal closeModal={() => setIsOpen(false)} isOpen={isOpen}>
        <UserProfileModal user={user} onClose={() => setIsOpen(false)} />
      </Modal>
      <div
        className="flex w-72 cursor-pointer flex-row items-center bg-secondary"
        onClick={() => setIsOpen(true)}
      >
        <div className="shrink-0 grow-0">
          <UserAvatar user={user} />
        </div>
        <div
          className="shrink grow overflow-hidden text-ellipsis text-2xl"
          style={{ wordBreak: 'keep-all' }}
        >
          {user.displayName}
        </div>
      </div>
    </>
  );
};

const AnonymousCard = () => {
  const navigation = useNavigate();

  return (
    <>
      <div
        className="flex w-72 cursor-pointer gap-x-6 bg-secondary"
        onClick={() => navigation('/auth')}
      >
        <p className="flex w-72 items-center justify-center text-5xl">LOGIN</p>
      </div>
    </>
  );
};

export const NavBar = () => {
  const [personalData] = useAtom(authAtom.personalData);
  const presentator = personalData ? (
    <UserCard user={personalData} />
  ) : (
    <AnonymousCard />
  );
  return (
    <>
      <div className="bg-primary bg-navbar-img">
        <div className="flex h-20 place-content-between">
          <p className="flex w-72 items-center justify-center text-5xl">HOME</p>
          {presentator}
        </div>
      </div>
    </>
  );
};

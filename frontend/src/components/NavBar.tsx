import { useAtom } from 'jotai';
import { Link } from 'react-router-dom';

import { authAtom } from '@/stores/auth';
import * as TD from '@/typedef';

import { UserAvatar } from './UserAvater';

type UserCardProp = {
  user: TD.User;
};

const UserCard = ({ user }: UserCardProp) => {
  return (
    <>
      <div className="flex w-72 flex-row items-center bg-secondary">
        <Link to="/auth" className="flex shrink grow flex-row items-center">
          <div className="shrink-0 grow-0">
            <UserAvatar user={user} />
          </div>
          <div
            className="shrink grow overflow-hidden text-ellipsis text-2xl"
            style={{ wordBreak: 'keep-all' }}
          >
            {user.displayName}
          </div>
        </Link>
      </div>
    </>
  );
};

const AnonymousCard = () => {
  return (
    <>
      <div className="flex w-72 cursor-pointer gap-x-6 bg-secondary">
        <Link to="/me" className="flex shrink grow flex-row items-center">
          <p className="flex w-72 items-center justify-center text-5xl">
            LOGIN
          </p>
        </Link>
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
          <p className="flex w-72 items-center justify-center text-5xl">
            <Link to="/">HOME</Link>
          </p>
          {presentator}
        </div>
      </div>
    </>
  );
};

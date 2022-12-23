import { useAtom } from 'jotai';
import { Link, useLocation } from 'react-router-dom';

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
        <Link
          to="/me"
          className="flex min-w-0 shrink grow flex-row items-center"
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
        </Link>
      </div>
    </>
  );
};

export const NavBar = () => {
  const [personalData] = useAtom(authAtom.personalData);
  const presentator = personalData ? <UserCard user={personalData} /> : null;
  const location = useLocation();
  const firstPath = (() => {
    const [fp] = location.pathname.split('/').filter((w) => !!w);
    return fp || '';
  })();
  const caption = (() => {
    switch (firstPath) {
      case '':
        return 'TOP';
      case 'pong':
        return 'PONG';
      case 'chat':
        return 'SOCIAL';
      case 'dm':
        return 'SOCIAL';
      case 'auth':
        return 'AUTH';
      case 'me':
        return 'ME';
    }
  })();

  return (
    <>
      <div className="bg-primary bg-navbar-img">
        <div className="flex h-20 place-content-between">
          <p className="flex w-72 items-center justify-center text-5xl">
            {caption}
          </p>
          {presentator}
        </div>
      </div>
    </>
  );
};

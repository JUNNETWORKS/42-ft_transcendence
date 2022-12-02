import { useAtom } from 'jotai';
import { Link, useRoutes } from 'react-router-dom';

import { OnlineStatusDot } from '@/components/OnlineStatusDot';
import { useUserDataReadOnly } from '@/stores/store';
import { dataAtom } from '@/stores/structure';
import * as TD from '@/typedef';

import { UserView } from './UserView';

const FriendListItem = (props: { user: TD.User }) => {
  const user = useUserDataReadOnly(props.user.id);
  if (!user) {
    return null;
  }
  return (
    <div className="hover:bg-white hover:text-black">
      <Link className="flex flex-row" to={`./user/${user.id}`}>
        <div className={`shrink-0 grow-0 self-center`}>
          <OnlineStatusDot user={props.user} />
        </div>
        <div
          className="shrink grow overflow-hidden text-ellipsis"
          style={{ wordBreak: 'keep-all' }}
        >
          {user.displayName}
        </div>
      </Link>
    </div>
  );
};

const FriendList = (props: { friends: TD.User[] }) => {
  return (
    <div className="h-full border-2 border-solid border-white">
      {props.friends.map((f) => (
        <FriendListItem user={f} key={f.id} />
      ))}
    </div>
  );
};

export const FriendsView = () => {
  const [friends] = useAtom(dataAtom.friends);

  const friendsRoutes = [
    { path: '/', element: null },
    { path: '/user/:id', element: <UserView /> },
  ];
  const routeElements = useRoutes([...friendsRoutes]);

  return (
    <div className="flex w-full flex-row border-2 border-solid border-white">
      <div className="h-full max-w-[10em] shrink-0 grow-0 basis-[10em]">
        <FriendList friends={friends} />
      </div>
      <div className="h-full shrink grow">{routeElements}</div>
    </div>
  );
};

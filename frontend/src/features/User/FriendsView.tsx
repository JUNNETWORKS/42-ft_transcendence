import { userAtoms } from '@/atoms';
import { useAtom } from 'jotai';
import * as TD from '@/typedef';
import { Link, useRoutes } from 'react-router-dom';
import { UserView } from './User';
import { VscCircleFilled } from 'react-icons/vsc';
import { useUserDataReadOnly } from '@/store';

const FriendListItem = (props: { user: TD.User }) => {
  const user = useUserDataReadOnly(props.user.id) || props.user;
  const onlineStatusColor = (user: TD.User) => {
    if (user.time) {
      return 'text-green-500';
    } else {
      return 'text-slate-500';
    }
  };
  return (
    <div className="hover:bg-white hover:text-black">
      <Link className="flex flex-row" to={`./user/${user.id}`}>
        <div className={`shrink-0 grow-0 self-center`}>
          <VscCircleFilled className={onlineStatusColor(user)} />
        </div>
        <div className="shrink grow">{user.displayName}</div>
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
  const [friends] = useAtom(userAtoms.friends);

  const friendsRoutes = [
    { path: '/', element: <></> },
    { path: '/user/:id', element: <UserView /> },
  ];
  const routeElements = useRoutes([...friendsRoutes]);

  return (
    <div className="flex w-full flex-row border-2 border-solid border-white">
      <div className="h-full shrink-0 grow-0 basis-[10em]">
        <FriendList friends={friends} />
      </div>
      <div className="h-full shrink grow">{routeElements}</div>
    </div>
  );
};

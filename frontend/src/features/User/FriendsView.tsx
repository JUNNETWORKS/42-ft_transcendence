import { userAtoms } from '@/atoms';
import { useAtom } from 'jotai';
import * as TD from '@/typedef';
import { Link, useRoutes } from 'react-router-dom';
import { UserView } from './User';

const FriendListItem = (props: { user: TD.User }) => {
  return (
    <div className="hover:bg-white hover:text-black">
      <Link className="block" to={`./user/${props.user.id}`}>
        {props.user.displayName}
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

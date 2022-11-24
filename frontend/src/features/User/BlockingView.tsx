import { useAtom } from 'jotai';
import * as TD from '@/typedef';
import { Link, useRoutes } from 'react-router-dom';
import { UserView } from './User';
import { useUserDataReadOnly } from '@/stores/store';
import { OnlineStatusDot } from '@/components/OnlineStatusDot';
import { dataAtom } from '@/stores/structure';

const BlockingListItem = (props: { user: TD.User }) => {
  const user = useUserDataReadOnly(props.user.id);
  return (
    <div className="hover:bg-white hover:text-black">
      <Link className="flex flex-row" to={`./user/${user.id}`}>
        <div className={`shrink-0 grow-0 self-center`}>
          <OnlineStatusDot user={props.user} />
        </div>
        <div className="shrink grow">{user.displayName}</div>
      </Link>
    </div>
  );
};

const BlockingList = (props: { blockingUsers: TD.User[] }) => {
  return (
    <div className="h-full border-2 border-solid border-white">
      {props.blockingUsers.map((f) => (
        <BlockingListItem user={f} key={f.id} />
      ))}
    </div>
  );
};

export const BlockingView = () => {
  const [blockingUsers] = useAtom(dataAtom.blockingUsers);

  const blockingRoutes = [
    { path: '/', element: <></> },
    { path: '/user/:id', element: <UserView /> },
  ];
  const routeElements = useRoutes([...blockingRoutes]);

  return (
    <div className="flex w-full flex-row border-2 border-solid border-white">
      <div className="h-full shrink-0 grow-0 basis-[10em]">
        <BlockingList blockingUsers={blockingUsers} />
      </div>
      <div className="h-full shrink grow">{routeElements}</div>
    </div>
  );
};